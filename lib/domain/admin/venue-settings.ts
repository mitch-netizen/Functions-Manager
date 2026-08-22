"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/domain/shared";

export interface VenueGeneralSettings {
  name: string;
  tradingName: string | null;
  address: string | null;
  abn: string | null;
  timezone: string;
  slug: string;
  legalEntityName: string | null;
  defaultOwnerUserId: string | null;
  gstRate: number;
  privacyNoticeUrl: string | null;
}

/** Combines venues + venue_settings — split across two tables (see DECISIONS.md), presented as one form. */
export async function getVenueGeneralSettings(venueId: string): Promise<VenueGeneralSettings | null> {
  const supabase = await createClient();
  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("name, trading_name, address, abn, timezone, slug")
    .eq("id", venueId)
    .maybeSingle();
  if (venueError) throw venueError;
  if (!venue) return null;

  const { data: settings, error: settingsError } = await supabase
    .from("venue_settings")
    .select("legal_entity_name, default_owner_user_id, gst_rate, privacy_notice_url")
    .eq("venue_id", venueId)
    .maybeSingle();
  if (settingsError) throw settingsError;

  return {
    name: venue.name,
    tradingName: venue.trading_name,
    address: venue.address,
    abn: venue.abn,
    timezone: venue.timezone,
    slug: venue.slug,
    legalEntityName: settings?.legal_entity_name ?? null,
    defaultOwnerUserId: settings?.default_owner_user_id ?? null,
    gstRate: settings?.gst_rate ?? 0.1,
    privacyNoticeUrl: settings?.privacy_notice_url ?? null,
  };
}

const updateSchema = z.object({
  venueId: z.string().uuid(),
  name: z.string().min(1),
  tradingName: z.string().optional(),
  address: z.string().optional(),
  abn: z.string().optional(),
  timezone: z.string().min(1),
  legalEntityName: z.string().optional(),
  defaultOwnerUserId: z.string().uuid().optional(),
  gstRate: z.coerce.number().min(0).max(1),
  privacyNoticeUrl: z.string().optional(),
});

export async function updateVenueGeneralSettings(input: z.infer<typeof updateSchema>): Promise<ActionResult<null>> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const supabase = await createClient();

  const { error: venueError } = await supabase
    .from("venues")
    .update({
      name: parsed.data.name,
      trading_name: parsed.data.tradingName || null,
      address: parsed.data.address || null,
      abn: parsed.data.abn || null,
      timezone: parsed.data.timezone,
    })
    .eq("id", parsed.data.venueId);
  if (venueError) return { ok: false, error: venueError.message };

  const { error: settingsError } = await supabase
    .from("venue_settings")
    .update({
      legal_entity_name: parsed.data.legalEntityName || null,
      default_owner_user_id: parsed.data.defaultOwnerUserId ?? null,
      gst_rate: parsed.data.gstRate,
      privacy_notice_url: parsed.data.privacyNoticeUrl || null,
    })
    .eq("venue_id", parsed.data.venueId);
  if (settingsError) return { ok: false, error: settingsError.message };

  revalidatePath("/admin/venue-settings");
  return { ok: true, data: null };
}
