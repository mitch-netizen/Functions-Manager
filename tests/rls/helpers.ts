import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, VenueRole } from "@/lib/types/database.types";

// Read from `supabase status -o env` (see .github/workflows/ci.yml and
// .env.test.example) rather than hardcoding local-dev keys here — the
// values `supabase start` generates are not guaranteed stable across CLI
// versions, so a stale hardcoded fallback would fail silently and
// confusingly instead of with a clear "env var missing" error.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Run \`supabase start\`, then \`supabase status -o env\` to get SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY / SUPABASE_TEST_SERVICE_ROLE_KEY (see .env.test.example).`
    );
  }
  return value;
}

const SUPABASE_URL = requiredEnv("SUPABASE_TEST_URL");
const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_TEST_SERVICE_ROLE_KEY");
const ANON_KEY = requiredEnv("SUPABASE_TEST_ANON_KEY");

export function adminClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface TestVenue {
  venueId: string;
  slug: string;
}

export async function createTestVenue(admin: SupabaseClient<Database>, slugPrefix: string): Promise<TestVenue> {
  const slug = `${slugPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await admin.from("venues").insert({ name: slug, slug }).select("id").single();
  if (error || !data) throw error ?? new Error("failed to create test venue");
  return { venueId: data.id, slug };
}

export interface TestUser {
  userId: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
}

/** Creates a confirmed user, signs them in, and grants them `role` on `venueId`. */
export async function createTestUser(admin: SupabaseClient<Database>, venueId: string, role: VenueRole): Promise<TestUser> {
  const email = `rls-test-${crypto.randomUUID()}@example.com`;
  const password = crypto.randomUUID();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("failed to create test user");

  const { error: membershipError } = await admin.from("venue_users").insert({ user_id: created.user.id, venue_id: venueId, role });
  if (membershipError) throw membershipError;

  const client = createClient<Database>(SUPABASE_URL, ANON_KEY);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { userId: created.user.id, email, password, client };
}
