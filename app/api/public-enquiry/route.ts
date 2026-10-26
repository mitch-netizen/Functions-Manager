import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBrand } from "@/lib/email/templates/brand";
import { EnquiryAckEmail } from "@/lib/email/templates/enquiry-ack";
import { OwnerNotificationEmail } from "@/lib/email/templates/owner-notification";
import { getEmailSender } from "@/lib/email/resend-sender";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

const LIMITS = { venueSlug: 100, contactName: 120, contactPhone: 40, contactEmail: 254, briefDescription: 2000 };
const tooLong = (value: string | null, max: number) => value !== null && value.length > max;

export async function POST(request: Request) {
  const body = await request.formData();
  const venueSlug = String(body.get("venueSlug") ?? "");
  const contactName = String(body.get("contactName") ?? "");
  const contactPhone = String(body.get("contactPhone") ?? "");
  const contactEmail = String(body.get("contactEmail") ?? "") || null;
  const preferredDate = String(body.get("preferredDate") ?? "") || null;
  const headcountEstimate = body.get("headcountEstimate") ? Number(body.get("headcountEstimate")) : null;
  const eventTypeId = String(body.get("eventTypeId") ?? "") || null;
  const briefDescription = String(body.get("briefDescription") ?? "") || null;
  const honeypot = String(body.get("website_url") ?? "") || null; // deliberately named to attract bots, not real users

  if (
    tooLong(venueSlug, LIMITS.venueSlug) ||
    tooLong(contactName, LIMITS.contactName) ||
    tooLong(contactPhone, LIMITS.contactPhone) ||
    tooLong(contactEmail, LIMITS.contactEmail) ||
    tooLong(briefDescription, LIMITS.briefDescription) ||
    (headcountEstimate !== null && (!Number.isInteger(headcountEstimate) || headcountEstimate < 1 || headcountEstimate > 5000)) ||
    (preferredDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate))
  ) {
    return NextResponse.json({ ok: false, error: "Please check your details and try again." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipHash = hashIp(forwardedFor?.split(",")[0]?.trim() ?? "unknown");

  // The RPC is only callable with the service-role key, so its rate limit
  // can't be skipped by calling it straight from the browser with a made-up
  // p_ip_hash. Its own SECURITY DEFINER checks still decide what's accepted.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_public_enquiry", {
    p_venue_slug: venueSlug,
    p_contact_name: contactName,
    p_contact_phone: contactPhone,
    p_contact_email: contactEmail,
    p_preferred_date: preferredDate,
    p_headcount_estimate: headcountEstimate,
    p_event_type_id: eventTypeId,
    p_brief_description: briefDescription,
    p_ip_hash: ipHash,
    p_honeypot: honeypot,
  });

  if (error) {
    // The function's own messages (rate limit, unknown venue) are safe to show; raw database errors aren't.
    const known = error.code === "P0001" && /too many|is required|unknown venue/i.test(error.message);
    return NextResponse.json({ ok: false, error: known ? error.message : "Sorry, we couldn't send your enquiry. Please try again or call us." }, { status: 400 });
  }

  const result = data?.[0];
  if (!result) {
    // Honeypot tripped — report success to the (likely bot) caller
    // without revealing anything real happened, per DECISIONS.md.
    return NextResponse.json({ ok: true });
  }

  // No RLS-scoped session exists for an anonymous submission, so the
  // notification step uses the admin client — the third documented
  // exception in DECISIONS.md.
  try {
    const { data: venueInfo } = await admin.rpc("get_public_venue_info", { p_slug: venueSlug });
    const venue = venueInfo?.[0];
    if (venue) {
      const brand = resolveBrand(venue.name, venue.brand_config);

      if (contactEmail) {
        await getEmailSender().send({
          to: contactEmail,
          subject: `We've received your enquiry — ${result.reference_number}`,
          react: EnquiryAckEmail({ brand, contactName, referenceNumber: result.reference_number }),
          tags: { venueId: venue.venue_id, enquiryId: result.enquiry_id },
        });
      }

      const { data: enquiryRow } = await admin.from("enquiries").select("owner_user_id").eq("id", result.enquiry_id).single();
      if (enquiryRow?.owner_user_id) {
        const { data: owner } = await admin.from("profiles").select("email, full_name").eq("id", enquiryRow.owner_user_id).single();
        if (owner?.email) {
          await getEmailSender().send({
            to: owner.email,
            subject: `New enquiry: ${contactName} (${result.reference_number})`,
            react: OwnerNotificationEmail({
              brand,
              ownerName: owner.full_name ?? "there",
              contactName,
              referenceNumber: result.reference_number,
              enquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/enquiries/${result.enquiry_id}`,
            }),
            tags: { venueId: venue.venue_id, enquiryId: result.enquiry_id },
          });
        }
      }
    }
  } catch {
    // The enquiry is already recorded regardless of email delivery — same
    // reasoning as every other creation path in this codebase.
  }

  return NextResponse.json({ ok: true, referenceNumber: result.reference_number });
}
