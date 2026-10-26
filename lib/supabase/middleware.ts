import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";
import { APP_KEY, PORTAL_URL, portalLoginUrl, portalNoAccessUrl, supabaseCookieOptions } from "@/lib/auth/portal";

/** Pages and endpoints anyone can use without signing in. */
const PUBLIC_PATHS = [/^\/enquire(\/|$)/, /^\/accommodation(\/|$)/, /^\/api\/public-/, /^\/api\/cron\//, /^\/auth\/callback$/];

/**
 * Refreshes the Supabase auth session on every request so server
 * components always see a valid, non-expired session. Required by
 * @supabase/ssr's cookie-based auth flow.
 *
 * With the shared staff login on (PORTAL_URL set), it also sends signed-out
 * visitors to the portal and turns away people who haven't been given this
 * app. Without it, page protection stays in requireSessionContext().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!PORTAL_URL) return response;

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => p.test(pathname))) return response;

  if (!user) {
    const returnTo = new URL(pathname === "/login" ? "/pipeline" : request.nextUrl.pathname + request.nextUrl.search, request.nextUrl.origin);
    return NextResponse.redirect(portalLoginUrl(returnTo.toString()));
  }

  // Fails closed: an error (including the check not existing yet) means no access.
  // has_app() comes from the shared staff-portal migration (queens-apps repo), so it
  // isn't in this app's generated types.
  const { data: allowed, error } = await (supabase as unknown as SupabaseClient).rpc("has_app", { p_app: APP_KEY });
  if (error || allowed !== true) {
    return NextResponse.redirect(portalNoAccessUrl());
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/pipeline", request.nextUrl.origin));
  }

  return response;
}
