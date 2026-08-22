"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";

export interface LostReasonRow {
  id: string;
  label: string;
  active: boolean;
  displayOrder: number;
}

export async function listLostReasons(venueId: string, includeInactive = false): Promise<LostReasonRow[]> {
  const supabase = await createClient();
  let query = supabase.from("lost_reasons").select("id, label, active, display_order").eq("venue_id", venueId).order("display_order");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, label: r.label, active: r.active, displayOrder: r.display_order }));
}

const createSchema = z.object({ label: z.string().min(1), displayOrder: z.coerce.number().int().default(0) });

export async function createLostReason(input: z.infer<typeof createSchema>): Promise<ActionResult<null>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("lost_reasons").insert({
    venue_id: ctx.activeVenueId,
    label: parsed.data.label,
    display_order: parsed.data.displayOrder,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/lost-reasons");
  return { ok: true, data: null };
}

export async function setLostReasonActive(id: string, active: boolean): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("lost_reasons").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/lost-reasons");
  return { ok: true, data: null };
}
