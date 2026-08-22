"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";

export interface SpaceRow {
  id: string;
  name: string;
  capacitySeated: number | null;
  capacityStanding: number | null;
  capacityCocktail: number | null;
  minimumSpend: number | null;
  notes: string | null;
  active: boolean;
  displayOrder: number;
}

export async function listSpaces(venueId: string, includeInactive = false): Promise<SpaceRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("spaces")
    .select("id, name, capacity_seated, capacity_standing, capacity_cocktail, minimum_spend, notes, active, display_order")
    .eq("venue_id", venueId)
    .order("display_order");
  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    capacitySeated: r.capacity_seated,
    capacityStanding: r.capacity_standing,
    capacityCocktail: r.capacity_cocktail,
    minimumSpend: r.minimum_spend,
    notes: r.notes,
    active: r.active,
    displayOrder: r.display_order,
  }));
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  capacitySeated: z.coerce.number().int().positive().optional(),
  capacityStanding: z.coerce.number().int().positive().optional(),
  capacityCocktail: z.coerce.number().int().positive().optional(),
  minimumSpend: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  displayOrder: z.coerce.number().int().default(0),
});

export async function upsertSpace(input: z.infer<typeof upsertSchema>): Promise<ActionResult<null>> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const row = {
    name: parsed.data.name,
    capacity_seated: parsed.data.capacitySeated ?? null,
    capacity_standing: parsed.data.capacityStanding ?? null,
    capacity_cocktail: parsed.data.capacityCocktail ?? null,
    minimum_spend: parsed.data.minimumSpend ?? null,
    notes: parsed.data.notes || null,
    display_order: parsed.data.displayOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("spaces").update(row).eq("id", parsed.data.id)
    : await supabase.from("spaces").insert({ ...row, venue_id: ctx.activeVenueId });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/spaces");
  return { ok: true, data: null };
}

export async function setSpaceActive(id: string, active: boolean): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("spaces").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/spaces");
  return { ok: true, data: null };
}
