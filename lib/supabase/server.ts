import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

/**
 * RLS-active client for server components and server actions. Every
 * domain read/write goes through this — never the admin client — so
 * authorization is always enforced by Postgres, not application code.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no request context to
            // write to; middleware.ts refreshes the session on every
            // request, so this is safe to ignore here.
          }
        },
      },
    }
  );
}
