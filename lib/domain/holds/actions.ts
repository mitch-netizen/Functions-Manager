"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import { addDays } from "date-fns";
import type { ActionResult } from "@/lib/domain/shared";
import { checkAvailability } from "./queries";

const createHoldSchema = z.object({
  enquiryId: z.string().uuid(),
  spaceId: z.string().uuid(),
  startsAt: z.string().min(1), // ISO datetime
  endsAt: z.string().min(1),
  holdType: z.enum(["tentative", "confirmed"]),
});

export interface CreateHoldResult {
  holdId: string;
  conflictWarnings: string[];
}

/**
 * Places a hold. Tentative-vs-tentative and tentative-vs-confirmed overlaps
 * are surfaced as warnings (checked before insert) but never block — only
 * confirmed-vs-confirmed is actually prevented, enforced by the
 * no_overlapping_confirmed_holds exclusion constraint at the DB level. If
 * that constraint rejects the insert, the error is translated into a
 * friendly message naming the conflicting enquiry rather than a raw
 * Postgres exclusion-violation message.
 */
export async function createHold(input: z.infer<typeof createHoldSchema>): Promise<ActionResult<CreateHoldResult>> {
  const parsed = createHoldSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const overlaps = await checkAvailability(ctx.activeVenueId, parsed.data.spaceId, parsed.data.startsAt, parsed.data.endsAt);
  const conflictWarnings = overlaps.map(
    (o) => `${o.holdType === "confirmed" ? "Confirmed" : "Tentative"} hold for ${o.enquiryContactName} (${o.enquiryReferenceNumber})`
  );

  let expiresAt: string | null = null;
  if (parsed.data.holdType === "tentative") {
    const { data: settings } = await supabase
      .from("venue_settings")
      .select("default_tentative_hold_days")
      .eq("venue_id", ctx.activeVenueId)
      .single();
    expiresAt = addDays(new Date(), settings?.default_tentative_hold_days ?? 14).toISOString();
  }

  const { data: hold, error } = await supabase
    .from("holds")
    .insert({
      venue_id: ctx.activeVenueId,
      enquiry_id: parsed.data.enquiryId,
      space_id: parsed.data.spaceId,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      hold_type: parsed.data.holdType,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) {
    // Postgres exclusion_violation
    if (error.code === "23P01") {
      const conflicting = overlaps.find((o) => o.holdType === "confirmed");
      return {
        ok: false,
        error: conflicting
          ? `Conflicts with a confirmed hold for ${conflicting.enquiryContactName} (${conflicting.enquiryReferenceNumber}).`
          : "Conflicts with an existing confirmed hold on this space.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  return { ok: true, data: { holdId: hold!.id, conflictWarnings } };
}

export async function releaseHold(holdId: string, enquiryId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("holds").update({ released_at: new Date().toISOString() }).eq("id", holdId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/calendar");
  revalidatePath(`/enquiries/${enquiryId}`);
  return { ok: true, data: null };
}
