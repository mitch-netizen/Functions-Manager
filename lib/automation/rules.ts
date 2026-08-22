import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format, subDays } from "date-fns";
import type { Database } from "@/lib/types/database.types";

type AdminClient = SupabaseClient<Database>;

interface VenueSettingsRow {
  venue_id: string;
  stale_enquiry_days: number;
  hold_expiry_warning_days: number;
  final_numbers_days_before_event: number;
  default_owner_user_id: string | null;
}

/**
 * Attempts to claim a rule firing for one subject/occurrence. Returns
 * false (no-op) if it already fired — this is the single mechanism every
 * rule below relies on for idempotency, rather than each rule inventing
 * its own dedupe check.
 */
async function tryClaim(
  admin: AdminClient,
  ruleKey: string,
  subjectTable: string,
  subjectId: string,
  occurrenceKey = ""
): Promise<boolean> {
  const { error } = await admin
    .from("automation_job_runs")
    .insert({ rule_key: ruleKey, subject_table: subjectTable, subject_id: subjectId, occurrence_key: occurrenceKey });
  if (error) {
    if (error.code === "23505") return false; // unique_violation: already fired
    throw error;
  }
  return true;
}

async function createTask(
  admin: AdminClient,
  params: { venueId: string; enquiryId?: string; eventId?: string; title: string; dueDate: string; assigneeUserId: string | null; source: string }
) {
  await admin.from("tasks").insert({
    venue_id: params.venueId,
    enquiry_id: params.enquiryId ?? null,
    event_id: params.eventId ?? null,
    title: params.title,
    due_date: params.dueDate,
    assignee_user_id: params.assigneeUserId,
    source: params.source,
  });
}

/** No activity on an open enquiry for N days -> task to owner. */
export async function runStaleEnquiriesRule(admin: AdminClient, venueId: string, settings: VenueSettingsRow, now: Date): Promise<number> {
  const threshold = subDays(now, settings.stale_enquiry_days).toISOString();

  const { data: candidates } = await admin
    .from("enquiries")
    .select("id, contact_name, owner_user_id, updated_at")
    .eq("venue_id", venueId)
    .not("status", "in", "(completed,lost,cancelled)")
    .lt("updated_at", threshold);

  let fired = 0;
  for (const enquiry of candidates ?? []) {
    const { data: recentActivity } = await admin
      .from("activities")
      .select("created_at")
      .eq("enquiry_id", enquiry.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastActivityAt = recentActivity?.created_at ?? enquiry.updated_at;
    if (lastActivityAt >= threshold) continue; // activity since — not actually stale

    const occurrenceKey = lastActivityAt; // a later activity resets the clock, allowing this to fire again after
    const claimed = await tryClaim(admin, "stale_enquiry", "enquiries", enquiry.id, occurrenceKey);
    if (!claimed) continue;

    await createTask(admin, {
      venueId,
      enquiryId: enquiry.id,
      title: `No activity on ${enquiry.contact_name}'s enquiry for ${settings.stale_enquiry_days}+ days`,
      dueDate: format(now, "yyyy-MM-dd"),
      assigneeUserId: enquiry.owner_user_id ?? settings.default_owner_user_id,
      source: "auto_stale_enquiry",
    });
    fired += 1;
  }
  return fired;
}

/** Tentative hold expiring in N days -> task to owner. */
export async function runHoldExpiryWarningRule(admin: AdminClient, venueId: string, settings: VenueSettingsRow, now: Date): Promise<number> {
  const warningCutoff = addDays(now, settings.hold_expiry_warning_days).toISOString();

  const { data: candidates } = await admin
    .from("holds")
    .select("id, enquiry_id, expires_at, enquiries(contact_name, owner_user_id)")
    .eq("venue_id", venueId)
    .eq("hold_type", "tentative")
    .is("released_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", warningCutoff)
    .gt("expires_at", now.toISOString())
    .returns<{ id: string; enquiry_id: string; expires_at: string; enquiries: { contact_name: string; owner_user_id: string | null } | null }[]>();

  let fired = 0;
  for (const hold of candidates ?? []) {
    const claimed = await tryClaim(admin, "hold_expiry_warning", "holds", hold.id);
    if (!claimed) continue;

    await createTask(admin, {
      venueId,
      enquiryId: hold.enquiry_id,
      title: `Tentative hold for ${hold.enquiries?.contact_name ?? "an enquiry"} expires soon`,
      dueDate: format(now, "yyyy-MM-dd"),
      assigneeUserId: hold.enquiries?.owner_user_id ?? settings.default_owner_user_id,
      source: "auto_hold_expiry_warning",
    });
    fired += 1;
  }
  return fired;
}

/** Tentative hold expired -> release it, flag the enquiry, task to owner. */
export async function runHoldExpiredRule(admin: AdminClient, venueId: string, settings: VenueSettingsRow, now: Date): Promise<number> {
  const { data: candidates } = await admin
    .from("holds")
    .select("id, enquiry_id, enquiries(contact_name, owner_user_id)")
    .eq("venue_id", venueId)
    .eq("hold_type", "tentative")
    .is("released_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", now.toISOString())
    .returns<{ id: string; enquiry_id: string; enquiries: { contact_name: string; owner_user_id: string | null } | null }[]>();

  let fired = 0;
  for (const hold of candidates ?? []) {
    const claimed = await tryClaim(admin, "hold_expired", "holds", hold.id);
    if (!claimed) continue;

    await admin.from("holds").update({ released_at: now.toISOString() }).eq("id", hold.id);
    await admin.from("activities").insert({
      venue_id: venueId,
      enquiry_id: hold.enquiry_id,
      type: "note",
      body: "Tentative hold expired and was automatically released.",
    });
    await createTask(admin, {
      venueId,
      enquiryId: hold.enquiry_id,
      title: `Tentative hold expired for ${hold.enquiries?.contact_name ?? "an enquiry"} — space released`,
      dueDate: format(now, "yyyy-MM-dd"),
      assigneeUserId: hold.enquiries?.owner_user_id ?? settings.default_owner_user_id,
      source: "auto_hold_expired",
    });
    fired += 1;
  }
  return fired;
}

/** N days before a confirmed event -> task: confirm final numbers and dietaries. */
export async function runEventFinalNumbersRule(admin: AdminClient, venueId: string, settings: VenueSettingsRow, now: Date): Promise<number> {
  const targetDate = addDays(now, settings.final_numbers_days_before_event);
  const dayStart = format(targetDate, "yyyy-MM-dd'T'00:00:00.000'Z'");
  const dayEnd = format(addDays(targetDate, 1), "yyyy-MM-dd'T'00:00:00.000'Z'");

  const { data: candidates } = await admin
    .from("events")
    .select("id, enquiry_id, enquiries(contact_name, owner_user_id)")
    .eq("venue_id", venueId)
    .is("completed_at", null)
    .gte("confirmed_starts_at", dayStart)
    .lt("confirmed_starts_at", dayEnd)
    .returns<{ id: string; enquiry_id: string; enquiries: { contact_name: string; owner_user_id: string | null } | null }[]>();

  let fired = 0;
  for (const event of candidates ?? []) {
    const claimed = await tryClaim(admin, "event_final_numbers", "events", event.id);
    if (!claimed) continue;

    await createTask(admin, {
      venueId,
      eventId: event.id,
      title: `Confirm final numbers and dietaries for ${event.enquiries?.contact_name ?? "this event"}`,
      dueDate: format(now, "yyyy-MM-dd"),
      assigneeUserId: event.enquiries?.owner_user_id ?? settings.default_owner_user_id,
      source: "auto_event_final_numbers",
    });
    fired += 1;
  }
  return fired;
}

/** Day after an event ends (and it hasn't been completed yet) -> prompt + task to capture actuals. */
export async function runPostEventPromptRule(admin: AdminClient, venueId: string, settings: VenueSettingsRow, now: Date): Promise<number> {
  const { data: candidates } = await admin
    .from("events")
    .select("id, enquiry_id, confirmed_ends_at, enquiries(contact_name, owner_user_id)")
    .eq("venue_id", venueId)
    .is("completed_at", null)
    .lt("confirmed_ends_at", now.toISOString())
    .returns<{ id: string; enquiry_id: string; confirmed_ends_at: string; enquiries: { contact_name: string; owner_user_id: string | null } | null }[]>();

  let fired = 0;
  for (const event of candidates ?? []) {
    const claimed = await tryClaim(admin, "post_event_prompt", "events", event.id);
    if (!claimed) continue;

    await createTask(admin, {
      venueId,
      eventId: event.id,
      title: `Record actual headcount and spend for ${event.enquiries?.contact_name ?? "this event"}`,
      dueDate: format(now, "yyyy-MM-dd"),
      assigneeUserId: event.enquiries?.owner_user_id ?? settings.default_owner_user_id,
      source: "auto_post_event_prompt",
    });
    fired += 1;
  }
  return fired;
}

export async function runAllRulesForVenue(admin: AdminClient, venueId: string, settings: VenueSettingsRow, now: Date): Promise<number> {
  const results = await Promise.all([
    runStaleEnquiriesRule(admin, venueId, settings, now),
    runHoldExpiryWarningRule(admin, venueId, settings, now),
    runHoldExpiredRule(admin, venueId, settings, now),
    runEventFinalNumbersRule(admin, venueId, settings, now),
    runPostEventPromptRule(admin, venueId, settings, now),
  ]);
  return results.reduce((sum, n) => sum + n, 0);
}
