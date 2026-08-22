"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import { getEmailSender } from "@/lib/email/resend-sender";
import { resolveBrand } from "@/lib/email/templates/brand";
import { EventConfirmedEmail } from "@/lib/email/templates/event-confirmed";
import type { ActionResult } from "@/lib/domain/shared";

const confirmEnquirySchema = z.object({
  enquiryId: z.string().uuid(),
  confirmedStartsAt: z.string().min(1),
  confirmedEndsAt: z.string().min(1),
  spaceIds: z.array(z.string().uuid()).min(1),
  finalHeadcount: z.coerce.number().int().positive().optional(),
});

/**
 * The pivotal Phase 4 action (brief 6.4): delegates the actual hold
 * conversion + event creation + status transition to the confirm_enquiry()
 * Postgres function so it happens atomically — see that function's
 * comment in the Phase 4 migration for why this can't safely be done as
 * several separate client round trips.
 */
export async function confirmEnquiry(input: z.infer<typeof confirmEnquirySchema>): Promise<ActionResult<{ eventId: string }>> {
  const parsed = confirmEnquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data: event, error } = await supabase.rpc("confirm_enquiry", {
    p_enquiry_id: parsed.data.enquiryId,
    p_confirmed_starts_at: new Date(parsed.data.confirmedStartsAt).toISOString(),
    p_confirmed_ends_at: new Date(parsed.data.confirmedEndsAt).toISOString(),
    p_space_ids: parsed.data.spaceIds,
    p_final_headcount: parsed.data.finalHeadcount ?? undefined,
  });
  if (error || !event) return { ok: false, error: error?.message ?? "failed to confirm enquiry" };

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("contact_name, contact_email, reference_number")
    .eq("id", parsed.data.enquiryId)
    .single();

  const { data: settings } = await supabase
    .from("venue_settings")
    .select("final_details_days_before_event")
    .eq("venue_id", ctx.activeVenueId)
    .single();

  await supabase.from("tasks").insert({
    venue_id: ctx.activeVenueId,
    event_id: event.id,
    title: `Confirm final details for ${enquiry?.contact_name ?? "this event"}`,
    due_date: format(
      addDays(new Date(parsed.data.confirmedStartsAt), -(settings?.final_details_days_before_event ?? 14)),
      "yyyy-MM-dd"
    ),
    assignee_user_id: ctx.userId,
    source: "auto_event_confirmed",
  });

  // The venue has no OpenTable partner/API access, so table-blocking can't
  // be automated (see DECISIONS.md) — a manual task is the honest
  // workaround until that changes, rather than pretending to sync.
  await supabase.from("tasks").insert({
    venue_id: ctx.activeVenueId,
    event_id: event.id,
    title: `Block tables in OpenTable for ${enquiry?.contact_name ?? "this event"}'s function (${format(
      new Date(parsed.data.confirmedStartsAt),
      "d MMM yyyy, h:mma"
    )} – ${format(new Date(parsed.data.confirmedEndsAt), "h:mma")})`,
    due_date: format(new Date(parsed.data.confirmedStartsAt), "yyyy-MM-dd"),
    assignee_user_id: ctx.userId,
    source: "auto_opentable_block",
  });

  if (enquiry?.contact_email) {
    try {
      const { data: venue } = await supabase.from("venues").select("name, brand_config").eq("id", ctx.activeVenueId).single();
      if (venue) {
        const brand = resolveBrand(venue.name, venue.brand_config);
        await getEmailSender().send({
          to: enquiry.contact_email,
          subject: `Your event at ${venue.name} is confirmed`,
          react: EventConfirmedEmail({
            brand,
            contactName: enquiry.contact_name,
            referenceNumber: enquiry.reference_number,
            confirmedDate: format(new Date(parsed.data.confirmedStartsAt), "d MMMM yyyy"),
          }),
          tags: { venueId: ctx.activeVenueId, enquiryId: parsed.data.enquiryId },
        });
        await supabase.from("activities").insert({
          venue_id: ctx.activeVenueId,
          enquiry_id: parsed.data.enquiryId,
          type: "email_sent",
          body: "Confirmation email sent to contact.",
        });
      }
    } catch {
      // The event is confirmed regardless of email delivery — same
      // reasoning as the enquiry-creation and quote-send paths.
    }
  }

  revalidatePath("/pipeline");
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  revalidatePath(`/events/${event.id}`);
  return { ok: true, data: { eventId: event.id } };
}

const updateDetailsSchema = z.object({
  eventId: z.string().uuid(),
  bumpInAt: z.string().optional(),
  bumpOutAt: z.string().optional(),
  roomSetup: z.string().optional(),
  avRequirements: z.string().optional(),
  specialInstructions: z.string().optional(),
  runSheetNotes: z.string().optional(),
});

export async function updateEventDetails(input: z.infer<typeof updateDetailsSchema>): Promise<ActionResult<null>> {
  const parsed = updateDetailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      bump_in_at: parsed.data.bumpInAt ? new Date(parsed.data.bumpInAt).toISOString() : null,
      bump_out_at: parsed.data.bumpOutAt ? new Date(parsed.data.bumpOutAt).toISOString() : null,
      room_setup: parsed.data.roomSetup || null,
      av_requirements: parsed.data.avRequirements || null,
      special_instructions: parsed.data.specialInstructions || null,
      run_sheet_notes: parsed.data.runSheetNotes || null,
    })
    .eq("id", parsed.data.eventId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/events/${parsed.data.eventId}`);
  return { ok: true, data: null };
}

const addDietarySchema = z.object({
  eventId: z.string().uuid(),
  requirement: z.string().min(1),
  headcount: z.coerce.number().int().positive().default(1),
});

export async function addDietaryRequirement(input: z.infer<typeof addDietarySchema>): Promise<ActionResult<null>> {
  const parsed = addDietarySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("event_dietary_requirements").insert({
    venue_id: ctx.activeVenueId,
    event_id: parsed.data.eventId,
    requirement: parsed.data.requirement,
    headcount: parsed.data.headcount,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/events/${parsed.data.eventId}`);
  return { ok: true, data: null };
}

export async function removeDietaryRequirement(id: string, eventId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_dietary_requirements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { ok: true, data: null };
}

const completeEventSchema = z.object({
  eventId: z.string().uuid(),
  enquiryId: z.string().uuid(),
  actualHeadcount: z.coerce.number().int().positive(),
  actualSpend: z.coerce.number().nonnegative(),
});

/**
 * Actual headcount and spend are required inputs to this action itself
 * (brief 6.6: "do not skip") rather than nudged-but-optional fields —
 * there is no way to complete an event without supplying both.
 */
export async function completeEvent(input: z.infer<typeof completeEventSchema>): Promise<ActionResult<null>> {
  const parsed = completeEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      actual_headcount: parsed.data.actualHeadcount,
      actual_spend: parsed.data.actualSpend,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.eventId);
  if (error) return { ok: false, error: error.message };

  const { error: statusError } = await supabase.rpc("update_enquiry_status", {
    p_enquiry_id: parsed.data.enquiryId,
    p_to_status: "completed",
  });
  if (statusError) return { ok: false, error: statusError.message };

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  revalidatePath("/pipeline");
  return { ok: true, data: null };
}
