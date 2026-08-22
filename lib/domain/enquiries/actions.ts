"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import { addBusinessDays } from "@/lib/automation/business-days";
import { getEmailSender } from "@/lib/email/resend-sender";
import { resolveBrand } from "@/lib/email/templates/brand";
import { EnquiryAckEmail } from "@/lib/email/templates/enquiry-ack";
import { OwnerNotificationEmail } from "@/lib/email/templates/owner-notification";
import type { EnquirySource, EnquiryStatus } from "@/lib/types/database.types";
import type { ActionResult } from "@/lib/domain/shared";

const createEnquirySchema = z.object({
  contactName: z.string().min(1),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal("")),
  organisation: z.string().optional(),
  eventTypeId: z.string().uuid().optional(),
  spacePreferenceId: z.string().uuid().optional(),
  preferredDate: z.string().optional(), // yyyy-mm-dd
  dateFlexible: z.boolean().optional(),
  headcountEstimate: z.coerce.number().int().positive().optional(),
  budgetIndication: z.coerce.number().nonnegative().optional(),
  briefDescription: z.string().optional(),
  source: z.enum(["phone", "email", "walk_in", "website", "social", "referral", "repeat"]),
  ownerUserId: z.string().uuid().optional(),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

/**
 * The primary capture path (brief 6.1): only contact name, phone, date,
 * headcount, and event type are meaningfully required by the UI — this
 * schema keeps everything else optional so the fast internal form and the
 * fuller manual-entry form share one action.
 */
export async function createEnquiry(input: CreateEnquiryInput): Promise<ActionResult<{ id: string; referenceNumber: string }>> {
  const parsed = createEnquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: referenceNumber, error: refError } = await supabase.rpc("next_enquiry_reference", {
    p_venue_id: ctx.activeVenueId,
  });
  if (refError) return { ok: false, error: refError.message };

  const { data: settings } = await supabase
    .from("venue_settings")
    .select("default_owner_user_id, default_followup_new_enquiry_business_days")
    .eq("venue_id", ctx.activeVenueId)
    .single();

  const ownerUserId = parsed.data.ownerUserId ?? settings?.default_owner_user_id ?? ctx.userId;

  const { data: enquiry, error: insertError } = await supabase
    .from("enquiries")
    .insert({
      venue_id: ctx.activeVenueId,
      reference_number: referenceNumber as string,
      source: parsed.data.source as EnquirySource,
      contact_name: parsed.data.contactName,
      contact_phone: parsed.data.contactPhone,
      contact_email: parsed.data.contactEmail || null,
      organisation: parsed.data.organisation || null,
      event_type_id: parsed.data.eventTypeId ?? null,
      space_preference_id: parsed.data.spacePreferenceId ?? null,
      preferred_date: parsed.data.preferredDate || null,
      date_flexible: parsed.data.dateFlexible ?? false,
      headcount_estimate: parsed.data.headcountEstimate ?? null,
      budget_indication: parsed.data.budgetIndication ?? null,
      brief_description: parsed.data.briefDescription || null,
      owner_user_id: ownerUserId,
      created_by: ctx.userId,
    })
    .select("id, reference_number")
    .single();

  if (insertError || !enquiry) return { ok: false, error: insertError?.message ?? "failed to create enquiry" };

  const followupDays = settings?.default_followup_new_enquiry_business_days ?? 1;
  await supabase.from("tasks").insert({
    venue_id: ctx.activeVenueId,
    enquiry_id: enquiry.id,
    title: `Follow up with ${parsed.data.contactName}`,
    due_date: addBusinessDays(new Date(), followupDays).toISOString().slice(0, 10),
    assignee_user_id: ownerUserId,
    source: "auto_new_enquiry",
  });

  await sendCreationEmails({
    venueId: ctx.activeVenueId,
    enquiryId: enquiry.id,
    contactName: parsed.data.contactName,
    contactEmail: parsed.data.contactEmail || null,
    referenceNumber: enquiry.reference_number,
    ownerUserId,
  });

  revalidatePath("/pipeline");
  return { ok: true, data: { id: enquiry.id, referenceNumber: enquiry.reference_number } };
}

async function sendCreationEmails(params: {
  venueId: string;
  enquiryId: string;
  contactName: string;
  contactEmail: string | null;
  referenceNumber: string;
  ownerUserId: string;
}) {
  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("name, brand_config")
    .eq("id", params.venueId)
    .single();
  if (!venue) return;

  const brand = resolveBrand(venue.name, venue.brand_config);
  const sender = getEmailSender();

  if (params.contactEmail) {
    try {
      await sender.send({
        to: params.contactEmail,
        subject: `We've received your enquiry — ${params.referenceNumber}`,
        react: EnquiryAckEmail({ brand, contactName: params.contactName, referenceNumber: params.referenceNumber }),
        tags: { venueId: params.venueId, enquiryId: params.enquiryId },
      });
      await supabase.from("activities").insert({
        venue_id: params.venueId,
        enquiry_id: params.enquiryId,
        type: "email_sent",
        body: "Acknowledgement email sent to contact.",
      });
    } catch {
      // Email delivery failure should not fail enquiry creation — the
      // enquiry itself is the source of truth, the ack is a courtesy.
    }
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", params.ownerUserId)
    .single();
  const ownerEmail = owner?.email;
  if (ownerEmail) {
    try {
      await sender.send({
        to: ownerEmail,
        subject: `New enquiry: ${params.contactName} (${params.referenceNumber})`,
        react: OwnerNotificationEmail({
          brand,
          ownerName: owner?.full_name ?? "there",
          contactName: params.contactName,
          referenceNumber: params.referenceNumber,
          enquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/enquiries/${params.enquiryId}`,
        }),
        tags: { venueId: params.venueId, enquiryId: params.enquiryId },
      });
    } catch {
      // Same as above — owner still sees it via the pipeline/task regardless.
    }
  }
}

const updateStatusSchema = z.object({
  enquiryId: z.string().uuid(),
  toStatus: z.enum(["new", "qualifying", "proposal_sent", "tentative", "confirmed", "completed", "lost", "cancelled"]),
  reasonId: z.string().uuid().optional(),
});

export async function updateEnquiryStatus(input: z.infer<typeof updateStatusSchema>): Promise<ActionResult<null>> {
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const supabase = await createClient();
  const { error, data } = await supabase.rpc("update_enquiry_status", {
    p_enquiry_id: parsed.data.enquiryId,
    p_to_status: parsed.data.toStatus as EnquiryStatus,
    p_reason_id: parsed.data.reasonId ?? undefined,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("activities").insert({
    venue_id: data.venue_id,
    enquiry_id: parsed.data.enquiryId,
    type: "status_change",
    body: `Status changed to ${parsed.data.toStatus}.`,
  });

  revalidatePath("/pipeline");
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  return { ok: true, data: null };
}

const addActivitySchema = z.object({
  enquiryId: z.string().uuid(),
  type: z.enum(["note", "email_sent", "email_received", "call", "meeting", "site_visit", "file_upload"]),
  body: z.string().min(1),
});

export async function addActivity(input: z.infer<typeof addActivitySchema>): Promise<ActionResult<null>> {
  const parsed = addActivitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    venue_id: ctx.activeVenueId,
    enquiry_id: parsed.data.enquiryId,
    type: parsed.data.type,
    body: parsed.data.body,
    actor_user_id: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  return { ok: true, data: null };
}
