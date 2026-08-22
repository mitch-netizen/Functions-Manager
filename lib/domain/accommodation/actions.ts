"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";

const createBlockSchema = z.object({
  eventId: z.string().uuid(),
  roomTypeCode: z.string().min(1),
  roomsHeld: z.coerce.number().int().positive(),
  checkInWindowStart: z.string().min(1),
  checkInWindowEnd: z.string().min(1),
  nightsAllowed: z.coerce.number().int().positive().default(1),
});

/**
 * Staff-facing: allocate a block of rooms in RMS against a confirmed
 * event, then hand out the resulting public_token as a shareable guest
 * booking link. Functions Manager tracks rooms_held as its own ledger —
 * RMS has no native "block" concept we call into here; each guest's
 * individual booking is checked against RMS's live availability and
 * created for real at booking time (see app/api/public-accommodation).
 */
export async function createAccommodationBlock(input: z.infer<typeof createBlockSchema>): Promise<ActionResult<{ publicToken: string }>> {
  const parsed = createBlockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accommodation_blocks")
    .insert({
      venue_id: ctx.activeVenueId,
      event_id: parsed.data.eventId,
      rms_room_type_code: parsed.data.roomTypeCode,
      rooms_held: parsed.data.roomsHeld,
      check_in_window_start: parsed.data.checkInWindowStart,
      check_in_window_end: parsed.data.checkInWindowEnd,
      nights_allowed: parsed.data.nightsAllowed,
      created_by: ctx.userId,
    })
    .select("public_token")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "failed to create accommodation block" };

  revalidatePath(`/events/${parsed.data.eventId}`);
  return { ok: true, data: { publicToken: data.public_token } };
}

export async function closeAccommodationBlock(blockId: string, eventId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("accommodation_blocks").update({ status: "closed" }).eq("id", blockId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/events/${eventId}`);
  return { ok: true, data: null };
}
