"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";
import type { VenueRole } from "@/lib/types/database.types";

export interface VenueUserRow {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: VenueRole;
}

export async function listVenueUsers(venueId: string): Promise<VenueUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venue_users")
    .select("id, user_id, role, profiles(email, full_name)")
    .eq("venue_id", venueId)
    .returns<{ id: string; user_id: string; role: VenueRole; profiles: { email: string; full_name: string | null } | null }[]>();
  if (error) throw error;

  return (data ?? []).map((row) => ({
    membershipId: row.id,
    userId: row.user_id,
    email: row.profiles?.email ?? "",
    fullName: row.profiles?.full_name ?? null,
    role: row.role,
  }));
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "coordinator", "viewer"]),
});

/**
 * Invites a user by email and grants them the given role on the active
 * venue. The invite step needs the service-role client (see admin.ts);
 * the venue_users insert that follows goes through the normal RLS-scoped
 * client, so "who can grant venue access" is still enforced by policy.
 */
export async function inviteVenueUser(input: z.infer<typeof inviteSchema>): Promise<ActionResult<null>> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  if (ctx.activeRole !== "admin") return { ok: false, error: "only an admin can invite users" };

  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email);
  if (inviteError || !invited?.user) return { ok: false, error: inviteError?.message ?? "invite failed" };

  const supabase = await createClient();
  const { error: membershipError } = await supabase.from("venue_users").insert({
    user_id: invited.user.id,
    venue_id: ctx.activeVenueId,
    role: parsed.data.role,
  });
  if (membershipError) return { ok: false, error: membershipError.message };

  revalidatePath("/admin/users");
  return { ok: true, data: null };
}

export async function updateVenueUserRole(membershipId: string, role: VenueRole): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("venue_users").update({ role }).eq("id", membershipId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, data: null };
}

export async function removeVenueUser(membershipId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("venue_users").delete().eq("id", membershipId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, data: null };
}
