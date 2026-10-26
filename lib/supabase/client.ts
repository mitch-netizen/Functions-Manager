import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import { supabaseCookieOptions } from "@/lib/auth/portal";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: supabaseCookieOptions }
  );
}
