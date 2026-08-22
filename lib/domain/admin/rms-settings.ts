"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";

export interface RmsSettings {
  agentId: string;
  clientId: string;
  /** The actual key is never sent back to the client once saved — only whether one is on file. */
  apiKeySet: boolean;
}

export async function getRmsSettings(venueId: string): Promise<RmsSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_rms_credentials")
    .select("rms_agent_id, rms_client_id, rms_api_key")
    .eq("venue_id", venueId)
    .maybeSingle();

  return {
    agentId: data?.rms_agent_id ?? "",
    clientId: data?.rms_client_id ?? "",
    apiKeySet: Boolean(data?.rms_api_key),
  };
}

const rmsSchema = z.object({
  agentId: z.string().min(1),
  clientId: z.string().min(1),
  // Blank means "keep the existing key" — see the comment on RmsSettings above.
  apiKey: z.string().optional(),
});

export async function updateRmsSettings(input: z.infer<typeof rmsSchema>): Promise<ActionResult<null>> {
  const parsed = rmsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const values: { venue_id: string; rms_agent_id: string; rms_client_id: string; rms_api_key?: string } = {
    venue_id: ctx.activeVenueId,
    rms_agent_id: parsed.data.agentId,
    rms_client_id: parsed.data.clientId,
  };
  if (parsed.data.apiKey) values.rms_api_key = parsed.data.apiKey;

  const { error } = await supabase.from("venue_rms_credentials").upsert(values, { onConflict: "venue_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/venue-settings");
  return { ok: true, data: null };
}
