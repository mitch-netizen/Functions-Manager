"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";
import type { Json } from "@/lib/types/database.types";

export interface BrandConfigFields {
  headingFont: string;
  bodyFont: string;
  goldColor: string;
  blackColor: string;
  charcoalColor: string;
  panelColor: string;
}

const DEFAULTS: BrandConfigFields = {
  headingFont: "",
  bodyFont: "",
  goldColor: "",
  blackColor: "",
  charcoalColor: "",
  panelColor: "",
};

export async function getBrandConfig(venueId: string): Promise<BrandConfigFields> {
  const supabase = await createClient();
  const { data } = await supabase.from("venues").select("brand_config").eq("id", venueId).single();
  const config = (data?.brand_config && typeof data.brand_config === "object" && !Array.isArray(data.brand_config)
    ? (data.brand_config as Record<string, Json>)
    : {}) as Record<string, string | undefined>;

  return {
    headingFont: config.headingFont ?? DEFAULTS.headingFont,
    bodyFont: config.bodyFont ?? DEFAULTS.bodyFont,
    goldColor: config.goldColor ?? DEFAULTS.goldColor,
    blackColor: config.blackColor ?? DEFAULTS.blackColor,
    charcoalColor: config.charcoalColor ?? DEFAULTS.charcoalColor,
    panelColor: config.panelColor ?? DEFAULTS.panelColor,
  };
}

const brandSchema = z.object({
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
  goldColor: z.string().optional(),
  blackColor: z.string().optional(),
  charcoalColor: z.string().optional(),
  panelColor: z.string().optional(),
});

export async function updateBrandConfig(input: z.infer<typeof brandSchema>): Promise<ActionResult<null>> {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("venues")
    .update({ brand_config: parsed.data as Json })
    .eq("id", ctx.activeVenueId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/venue-settings");
  return { ok: true, data: null };
}

export interface TermsAndConditionsInfo {
  filename: string;
}

export async function getTermsAndConditions(venueId: string): Promise<TermsAndConditionsInfo | null> {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("venue_settings")
    .select("terms_and_conditions_file_id")
    .eq("venue_id", venueId)
    .single();
  if (!settings?.terms_and_conditions_file_id) return null;

  const { data: file } = await supabase.from("files").select("filename").eq("id", settings.terms_and_conditions_file_id).single();
  return file ? { filename: file.filename } : null;
}

export async function uploadTermsAndConditions(formData: FormData): Promise<ActionResult<null>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "choose a file" };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const arrayBuffer = await file.arrayBuffer();
  const storagePath = `${ctx.activeVenueId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("venue-documents")
    .upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type || "application/octet-stream" });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: fileRow, error: fileError } = await supabase
    .from("files")
    .insert({
      venue_id: ctx.activeVenueId,
      filename: file.name,
      storage_path: storagePath,
      file_type: "terms_and_conditions",
      uploaded_by: ctx.userId,
    })
    .select("id")
    .single();
  if (fileError || !fileRow) return { ok: false, error: fileError?.message ?? "upload failed" };

  const { error: settingsError } = await supabase
    .from("venue_settings")
    .update({ terms_and_conditions_file_id: fileRow.id })
    .eq("venue_id", ctx.activeVenueId);
  if (settingsError) return { ok: false, error: settingsError.message };

  revalidatePath("/admin/venue-settings");
  return { ok: true, data: null };
}
