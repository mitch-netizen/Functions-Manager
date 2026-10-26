import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAllRulesForVenue } from "@/lib/automation/rules";

/**
 * Vercel Cron's single daily entry point for every automation rule from
 * the brief's table that isn't already handled synchronously by the
 * action that triggers it (enquiry creation, quote send, and enquiry
 * confirmation all fire their own emails/tasks inline — see
 * lib/domain/{enquiries,quotes,events}/actions.ts). This route only
 * covers the rules that depend on the passage of time: staleness, hold
 * expiry, and event-proximity reminders.
 *
 * Uses the service-role client — the one documented exception in
 * DECISIONS.md, since this is a system-triggered sweep across every
 * venue, not a single user's request.
 */
export async function GET(request: Request) {
  // Fails closed: with no CRON_SECRET set, nothing can call this.
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: venues, error: venuesError } = await admin.from("venues").select("id").eq("active", true);
  if (venuesError) return NextResponse.json({ error: venuesError.message }, { status: 500 });

  let totalActions = 0;
  const perVenue: Record<string, number> = {};

  for (const venue of venues ?? []) {
    const { data: settings } = await admin
      .from("venue_settings")
      .select("venue_id, stale_enquiry_days, hold_expiry_warning_days, final_numbers_days_before_event, default_owner_user_id")
      .eq("venue_id", venue.id)
      .single();
    if (!settings) continue;

    const actions = await runAllRulesForVenue(admin, venue.id, settings, now);
    perVenue[venue.id] = actions;
    totalActions += actions;
  }

  return NextResponse.json({ ok: true, totalActions, perVenue });
}
