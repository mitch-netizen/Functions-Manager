"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";
import type { PackageCategory } from "@/lib/types/database.types";

export interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  perHeadPrice: number | null;
  minimumNumbers: number | null;
  inclusions: string[];
  category: PackageCategory;
  active: boolean;
}

export async function listPackages(venueId: string, includeInactive = false): Promise<PackageRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("packages")
    .select("id, name, description, per_head_price, minimum_numbers, inclusions, category, active")
    .eq("venue_id", venueId)
    .order("category")
    .order("name");
  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    perHeadPrice: r.per_head_price,
    minimumNumbers: r.minimum_numbers,
    inclusions: Array.isArray(r.inclusions) ? (r.inclusions as string[]) : [],
    category: r.category,
    active: r.active,
  }));
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  perHeadPrice: z.coerce.number().nonnegative().optional(),
  minimumNumbers: z.coerce.number().int().positive().optional(),
  inclusions: z.string().optional(), // newline-separated, parsed into a jsonb array
  category: z.enum(["food", "beverage", "room_hire", "av", "other"]),
});

export async function createPackage(input: z.infer<typeof createSchema>): Promise<ActionResult<null>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const inclusions = (parsed.data.inclusions ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.from("packages").insert({
    venue_id: ctx.activeVenueId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    per_head_price: parsed.data.perHeadPrice ?? null,
    minimum_numbers: parsed.data.minimumNumbers ?? null,
    inclusions,
    category: parsed.data.category as PackageCategory,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/packages");
  return { ok: true, data: null };
}

export async function setPackageActive(id: string, active: boolean): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("packages").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/packages");
  return { ok: true, data: null };
}
