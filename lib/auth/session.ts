import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VenueRole } from "@/lib/types/database.types";

const ACTIVE_VENUE_COOKIE = "active_venue_id";

export interface VenueMembership {
  venueId: string;
  venueName: string;
  role: VenueRole;
}

export interface SessionContext {
  userId: string;
  email: string | null;
  memberships: VenueMembership[];
  /** null when the user belongs to >1 venue and hasn't picked one yet. */
  activeVenueId: string | null;
  activeRole: VenueRole | null;
}

/**
 * Resolves the signed-in user, every venue they belong to (via their own
 * venue_users rows — RLS always lets a user see their own membership), and
 * which venue is currently active. Venue scoping is session/cookie based,
 * not URL based (see DECISIONS.md) — RLS is the real boundary regardless.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships, error } = await supabase
    .from("venue_users")
    .select("venue_id, role, venues(name)")
    .returns<{ venue_id: string; role: VenueRole; venues: { name: string } | null }[]>();

  if (error) throw error;

  const resolved: VenueMembership[] = (memberships ?? []).map((m) => ({
    venueId: m.venue_id,
    venueName: m.venues?.name ?? "Unknown venue",
    role: m.role,
  }));

  const cookieStore = await cookies();
  const cookieVenueId = cookieStore.get(ACTIVE_VENUE_COOKIE)?.value ?? null;

  let activeVenueId: string | null = null;
  if (resolved.length === 1) {
    activeVenueId = resolved[0].venueId;
  } else if (cookieVenueId && resolved.some((m) => m.venueId === cookieVenueId)) {
    activeVenueId = cookieVenueId;
  }

  const activeRole = resolved.find((m) => m.venueId === activeVenueId)?.role ?? null;

  return {
    userId: user.id,
    email: user.email ?? null,
    memberships: resolved,
    activeVenueId,
    activeRole,
  };
}

/**
 * For use in server components/actions that require an authenticated user
 * with an active venue resolved. Redirects to /login (no session) or
 * /choose-venue (session but no active venue selected) otherwise.
 */
export async function requireSessionContext(): Promise<
  SessionContext & { activeVenueId: string; activeRole: VenueRole }
> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeVenueId || !ctx.activeRole) redirect("/choose-venue");
  return ctx as SessionContext & { activeVenueId: string; activeRole: VenueRole };
}

export async function setActiveVenue(venueId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_VENUE_COOKIE, venueId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
