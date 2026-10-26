import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRmsClient } from "@/lib/integrations/rms/rms-cloud-client";
import { bookAccommodation } from "@/lib/domain/accommodation/booking-flow";
import { resolveBrand } from "@/lib/email/templates/brand";
import { AccommodationBookingConfirmationEmail } from "@/lib/email/templates/accommodation-booking-confirmation";
import { getEmailSender } from "@/lib/email/resend-sender";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** Same cap record_public_accommodation_booking() applies, checked here before RMS is called. */
const MAX_ATTEMPTS_PER_HOUR = 5;

/**
 * Every read and write here goes through the admin (service-role) client —
 * a fourth documented exception in DECISIONS.md/lib/supabase/admin.ts,
 * alongside the cron route and public-enquiry's post-insert step. Unlike
 * those, this route needs the admin client *before* any write too: the
 * block's venue_id and its RMS credentials (venue_rms_credentials is
 * admin/manager-only under RLS) must be looked up to even call RMS, and an
 * anonymous guest has no session to scope an RLS-scoped client to for
 * either. The actual capacity/rate-limit/honeypot authorization is still
 * entirely inside record_public_accommodation_booking()'s own SECURITY
 * DEFINER checks — the admin client here is just the transport, not a
 * widening of who's allowed to book.
 */
export async function POST(request: Request) {
  const body = await request.formData();
  const token = String(body.get("token") ?? "");
  const guestName = String(body.get("guestName") ?? "");
  const guestEmail = String(body.get("guestEmail") ?? "") || null;
  const guestPhone = String(body.get("guestPhone") ?? "") || null;
  const checkIn = String(body.get("checkIn") ?? "");
  const checkOut = String(body.get("checkOut") ?? "");
  const honeypot = String(body.get("website_url") ?? "") || null; // deliberately named to attract bots, not real users

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipHash = hashIp(forwardedFor?.split(",")[0]?.trim() ?? "unknown");

  const admin = createAdminClient();

  const { data: block } = await admin
    .from("accommodation_blocks")
    .select("id, venue_id, rms_room_type_code, status, check_in_window_start, check_in_window_end, nights_allowed, rooms_held")
    .eq("public_token", token)
    .maybeSingle();

  if (!block || block.status !== "active") {
    return NextResponse.json({ ok: false, error: "This booking link is no longer active." }, { status: 404 });
  }

  if (honeypot) {
    // Bot: report success without doing anything real, same as the enquiry form.
    return NextResponse.json({ ok: true });
  }

  if (!guestName.trim() || !checkIn || !checkOut) {
    return NextResponse.json({ ok: false, error: "Please fill in your name and dates." }, { status: 400 });
  }
  if (guestName.length > 120 || (guestEmail?.length ?? 0) > 254 || (guestPhone?.length ?? 0) > 40) {
    return NextResponse.json({ ok: false, error: "Please check your details and try again." }, { status: 400 });
  }

  // Everything the database would reject is checked first, so a booking is
  // never made in RMS only to be cancelled again.
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS;
  if (!ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut) || !Number.isFinite(nights) || nights < 1) {
    return NextResponse.json({ ok: false, error: "Check-out needs to be after check-in." }, { status: 400 });
  }
  if (checkIn < block.check_in_window_start || checkIn > block.check_in_window_end) {
    return NextResponse.json({ ok: false, error: "That check-in date isn't available for this booking link." }, { status: 400 });
  }
  if (nights > block.nights_allowed) {
    return NextResponse.json({ ok: false, error: `This booking link allows up to ${block.nights_allowed} nights.` }, { status: 400 });
  }

  const windowStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const [{ data: attempts }, { count: confirmed }] = await Promise.all([
    admin
      .from("public_accommodation_rate_limit")
      .select("count")
      .eq("ip_hash", ipHash)
      .eq("block_id", block.id)
      .eq("window_start", windowStart)
      .maybeSingle(),
    admin.from("accommodation_bookings").select("id", { count: "exact", head: true }).eq("block_id", block.id).eq("status", "confirmed"),
  ]);
  if ((attempts?.count ?? 0) >= MAX_ATTEMPTS_PER_HOUR) {
    return NextResponse.json({ ok: false, error: "Too many booking attempts. Please try again later." }, { status: 429 });
  }
  if ((confirmed ?? 0) >= block.rooms_held) {
    return NextResponse.json({ ok: false, error: "This room block is fully booked." }, { status: 409 });
  }

  const { data: credentials } = await admin
    .from("venue_rms_credentials")
    .select("rms_agent_id, rms_client_id, rms_api_key")
    .eq("venue_id", block.venue_id)
    .maybeSingle();

  if (!credentials?.rms_agent_id || !credentials.rms_client_id || !credentials.rms_api_key) {
    return NextResponse.json({ ok: false, error: "Accommodation booking isn't available for this venue yet." }, { status: 503 });
  }
  const rmsCredentials = { agentId: credentials.rms_agent_id, clientId: credentials.rms_client_id, apiKey: credentials.rms_api_key };
  const rms = getRmsClient();

  const result = await bookAccommodation(
    rms,
    rmsCredentials,
    { roomTypeCode: block.rms_room_type_code, checkIn, checkOut, guestName, guestEmail, guestPhone },
    async (rmsBookingReference) => {
      const { data: recorded, error: recordError } = await admin.rpc("record_public_accommodation_booking", {
        p_block_token: token,
        p_guest_name: guestName,
        p_guest_email: guestEmail,
        p_guest_phone: guestPhone,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_room_type_code: block.rms_room_type_code,
        p_rms_booking_reference: rmsBookingReference,
        p_ip_hash: ipHash,
        p_honeypot: null, // already checked above
      });
      if (recordError || !recorded?.[0]) {
        const known = recordError?.code === "P0001" && /too many|fully booked|window|nights|required/i.test(recordError.message);
        return { ok: false, error: known ? recordError!.message : "Sorry, we couldn't complete the booking. Please call us." };
      }
      return { ok: true };
    }
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  try {
    const { data: venue } = await admin.from("venues").select("name, brand_config").eq("id", block.venue_id).single();
    if (venue && guestEmail) {
      const brand = resolveBrand(venue.name, venue.brand_config);
      await getEmailSender().send({
        to: guestEmail,
        subject: `Your room at ${venue.name} is booked`,
        react: AccommodationBookingConfirmationEmail({
          brand,
          guestName,
          checkIn,
          checkOut,
          rmsBookingReference: result.rmsBookingReference,
        }),
        tags: { venueId: block.venue_id, blockId: block.id },
      });
    }
  } catch {
    // The booking is confirmed regardless of email delivery.
  }

  return NextResponse.json({ ok: true, rmsBookingReference: result.rmsBookingReference });
}
