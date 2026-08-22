-- Phase 5: the automation idempotency ledger. Dashboard and venue-settings
-- timing fields need no new schema — the dashboard is read-only aggregation
-- over existing tables, and every timing field venue_settings needs was
-- already added in the Phase 1 migration (only the Admin UI to edit them
-- was deferred to this phase, per the brief's "weave admin in
-- incrementally" instruction).

-- occurrence_key lets a rule fire again for the same subject after a prior
-- occurrence resolves and recurs (e.g. an enquiry goes stale, gets a note
-- added, then goes stale again later) — for rules keyed to a one-time
-- event that can only happen once (a specific hold expiring, a specific
-- event's final-numbers reminder), it stays ''. The unique constraint
-- keyed on all four columns is what actually stops any rule from firing
-- twice for the same subject/occurrence, regardless of how many times the
-- cron route runs or overlaps.
create table automation_job_runs (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  subject_table text not null,
  subject_id uuid not null,
  occurrence_key text not null default '',
  fired_at timestamptz not null default now(),
  unique (rule_key, subject_table, subject_id, occurrence_key)
);

create index automation_job_runs_subject_idx on automation_job_runs (subject_table, subject_id);

alter table automation_job_runs enable row level security;

-- Written only by the cron route via the service-role client (bypasses
-- RLS entirely, per DECISIONS.md's one documented exception) — no insert
-- policy at all. Readable by admin/manager for debugging visibility into
-- what automation has actually fired.
create policy automation_job_runs_select on automation_job_runs for select
  using (
    subject_id in (
      select id from enquiries where venue_id in (select auth_venue_ids())
      union
      select id from events where venue_id in (select auth_venue_ids())
      union
      select id from holds where venue_id in (select auth_venue_ids())
    )
  );
