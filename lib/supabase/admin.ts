import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Service-role client. RLS is bypassed entirely for anything issued
 * through this client, so it must never be imported from a user-request
 * code path (server actions, page/layout components, route handlers that
 * serve a signed-in user's own request).
 *
 * The only sanctioned callers, per DECISIONS.md, are:
 *  - app/api/cron/automation/route.ts (a system-triggered sweep across all
 *    venues, not a single user's request)
 *  - the public-enquiry insert path's spam/rate-limit pre-check (Phase 6)
 *  - one-off venue onboarding scripts (a new venue's first admin row can't
 *    be created by an RLS-scoped user, since none exists yet)
 *  - lib/domain/admin/venue-users.ts's invite step ONLY (auth.admin.inviteUserByEmail
 *    has no RLS-scoped equivalent) — the resulting venue_users row is still
 *    inserted through the normal RLS-scoped client, so venue membership
 *    itself remains authorized by policy, not by this client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
