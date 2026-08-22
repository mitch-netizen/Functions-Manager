"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";

export interface EventTypeRow {
  id: string;
  name: string;
  active: boolean;
  displayOrder: number;
}

export async function listEventTypes(venueId: string, includeInactive = false): Promise<EventTypeRow[]> {
  const supabase = await createClient();
  let query = supabase.from("event_types").select("id, name, active, display_order").eq("venue_id", venueId).order("display_order");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, active: r.active, displayOrder: r.display_order }));
}

const createSchema = z.object({ name: z.string().min(1), displayOrder: z.coerce.number().int().default(0) });

export async function createEventType(input: z.infer<typeof createSchema>): Promise<ActionResult<null>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("event_types").insert({
    venue_id: ctx.activeVenueId,
    name: parsed.data.name,
    display_order: parsed.data.displayOrder,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/event-types");
  return { ok: true, data: null };
}

export async function setEventTypeActive(id: string, active: boolean): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_types").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/event-types");
  return { ok: true, data: null };
}
