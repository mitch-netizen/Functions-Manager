"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/domain/shared";

export interface AutomationSettings {
  defaultTentativeHoldDays: number;
  defaultFollowupNewEnquiryBusinessDays: number;
  defaultFollowupProposalSentBusinessDays: number;
  staleEnquiryDays: number;
  holdExpiryWarningDays: number;
  finalDetailsDaysBeforeEvent: number;
  finalNumbersDaysBeforeEvent: number;
}

export async function getAutomationSettings(venueId: string): Promise<AutomationSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_settings")
    .select(
      "default_tentative_hold_days, default_followup_new_enquiry_business_days, default_followup_proposal_sent_business_days, stale_enquiry_days, hold_expiry_warning_days, final_details_days_before_event, final_numbers_days_before_event"
    )
    .eq("venue_id", venueId)
    .single();

  return {
    defaultTentativeHoldDays: data?.default_tentative_hold_days ?? 14,
    defaultFollowupNewEnquiryBusinessDays: data?.default_followup_new_enquiry_business_days ?? 1,
    defaultFollowupProposalSentBusinessDays: data?.default_followup_proposal_sent_business_days ?? 3,
    staleEnquiryDays: data?.stale_enquiry_days ?? 7,
    holdExpiryWarningDays: data?.hold_expiry_warning_days ?? 3,
    finalDetailsDaysBeforeEvent: data?.final_details_days_before_event ?? 14,
    finalNumbersDaysBeforeEvent: data?.final_numbers_days_before_event ?? 7,
  };
}

const updateSchema = z.object({
  defaultTentativeHoldDays: z.coerce.number().int().positive(),
  defaultFollowupNewEnquiryBusinessDays: z.coerce.number().int().positive(),
  defaultFollowupProposalSentBusinessDays: z.coerce.number().int().positive(),
  staleEnquiryDays: z.coerce.number().int().positive(),
  holdExpiryWarningDays: z.coerce.number().int().positive(),
  finalDetailsDaysBeforeEvent: z.coerce.number().int().positive(),
  finalNumbersDaysBeforeEvent: z.coerce.number().int().positive(),
});

export async function updateAutomationSettings(venueId: string, input: z.infer<typeof updateSchema>): Promise<ActionResult<null>> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("venue_settings")
    .update({
      default_tentative_hold_days: parsed.data.defaultTentativeHoldDays,
      default_followup_new_enquiry_business_days: parsed.data.defaultFollowupNewEnquiryBusinessDays,
      default_followup_proposal_sent_business_days: parsed.data.defaultFollowupProposalSentBusinessDays,
      stale_enquiry_days: parsed.data.staleEnquiryDays,
      hold_expiry_warning_days: parsed.data.holdExpiryWarningDays,
      final_details_days_before_event: parsed.data.finalDetailsDaysBeforeEvent,
      final_numbers_days_before_event: parsed.data.finalNumbersDaysBeforeEvent,
    })
    .eq("venue_id", venueId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/venue-settings");
  return { ok: true, data: null };
}
