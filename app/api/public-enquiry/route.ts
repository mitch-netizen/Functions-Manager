import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBrand } from "@/lib/email/templates/brand";
import { EnquiryAckEmail } from "@/lib/email/templates/enquiry-ack";
import { OwnerNotificationEmail } from "@/lib/email/templates/owner-notification";
import { getEmailSender } from "@/lib/email/resend-sender";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

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

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipHash = hashIp(forwardedFor?.split(",")[0]?.trim() ?? "unknown");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_enquiry", {
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
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
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
    const admin = createAdminClient();
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
