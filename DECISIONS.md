# Decisions

Judgment calls made where the build brief was ambiguous or silent, per the
brief's own instruction to choose the simpler option and record it here
rather than building for multiple cases.

- **Business data is admin-configurable, not seeded placeholders.** The
  brief's open items (bookable spaces, package pricing, event-type list,
  lost-reason list, legal entity name/ABN, T&Cs) are not filled with fake
  seed data pending confirmation from Mitch/Micheala. This product is sold
  to venues whose business data is unknowable in advance, so event types
  and lost reasons are venue-scoped lookup tables (not hardcoded enums),
  spaces and packages are Admin-CRUD entities, and `venue_settings` fields
  are nullable by default. A new venue's Admin screens start empty with an
  onboarding prompt, not fake data.
- `venue_settings` is a separate 1:1 table from `venues`, not columns on
  `venues` — keeps venue *identity* separate from *runtime configuration*
  and lets the settings row be auto-created empty (via trigger) the moment
  a venue exists, without touching the venues row shape.
- Global "admin" access is modeled as a `venue_users` row with role='admin'
  repeated per venue an admin administers, not a separate global-admin
  flag/table. One authorization mechanism only.
- No URL-based venue scoping (e.g. `/[venueId]/...`). The active venue is
  resolved from session + a cookie, and RLS is the actual authorization
  boundary regardless of what a URL might claim — a URL segment would be
  redundant and could desync from the session.
- New-venue onboarding is a seeded DB insert (a `venues` row + the first
  `venue_users` admin row), performed with the service-role key outside any
  user session, not a self-serve signup wizard — per the brief's explicit
  allowance that "adding a venue can be a seeded database insert."
- Status transitions (`update_enquiry_status`) and reference-number
  allocation (`next_enquiry_reference`) are SECURITY DEFINER Postgres
  functions with the venue/role authorization check re-implemented
  explicitly inside them, because the tables they write to
  (`enquiry_status_history`, `venue_counters`) intentionally have no direct
  client-facing RLS write policy — they are only ever written through these
  functions, keeping "who can do this" defined in exactly one place per
  operation instead of two.
- `files` table (brief lists it under the Phase 4 data model) is created in
  the Phase 3 migration instead, because `quotes.pdf_file_id` needs it and
  Phase 3 (quoting) ships before Phase 4 (events).
- PDF renderer: `@react-pdf/renderer` (server-side, React-based, no headless
  browser dependency) over Puppeteer/Playwright HTML-to-PDF.
- Email: Resend, behind a swappable `EmailSender` interface
  (`lib/email/sender.ts`), using React Email components for templates.
- Scheduled automation: a single daily Vercel Cron route
  (`app/api/cron/automation/route.ts`) over Supabase pg_cron/Edge
  Functions — keeps all automation logic in the same TypeScript codebase as
  the domain actions it reuses; every rule in the brief is daily-cadence.
  This route is the one documented exception permitted to use the
  service-role Supabase client, since it is a system-triggered sweep across
  all venues, not a user request.
- Inviting a new user by email (Admin → Users) is a second, narrow,
  documented exception to "no service role key in a request-scoped path":
  `auth.admin.inviteUserByEmail` has no RLS-scoped equivalent. Only that one
  call uses the admin client; the resulting `venue_users` row is inserted
  immediately after through the normal RLS-scoped client, so venue
  membership itself is still authorized by policy (caller must be an admin
  of that venue), not by the admin client.
- Automation idempotency is a single generic `automation_job_runs` ledger
  table (`rule_key` + `subject_table` + `subject_id` + `occurrence_key`,
  unique constraint), not per-rule dedupe flags scattered across domain
  tables. `occurrence_key` defaults to `''` for rules tied to a one-time
  event (a hold's single expiry, an event's single final-numbers
  reminder); the stale-enquiry rule sets it to the enquiry's
  last-activity timestamp, so a fresh staleness episode after a new
  activity resets the clock can fire again rather than being permanently
  suppressed by the first occurrence.
- The automation cron runs once daily and compares against `now` in server
  (UTC) time rather than converting every check into each venue's local
  calendar day — for daily-cadence reminders (days-before-event,
  days-since-activity) a few hours of slop near a venue's local midnight
  is an acceptable simplification, not worth the added complexity of
  per-venue day-boundary math.
- A quote's minimum-spend handling (brief doesn't specify the mechanics):
  `subtotal` always reflects the raw line-item sum; if the enquiry's
  preferred space has a minimum spend exceeding that sum,
  `minimum_spend_applied` records it and `total`/`gst_amount` are computed
  from the minimum instead of the raw subtotal.
- Dashboard "pipeline value weighted by status" (brief doesn't specify
  weights): an open enquiry's latest quote total (or `budget_indication`
  if no quote exists yet) is multiplied by a per-status weight
  approximating conversion likelihood (new 0.1 ... confirmed 1.0), summed
  across all open enquiries. See `STATUS_WEIGHTS` in
  `lib/domain/dashboard/queries.ts`.
- Business-day math treats Monday–Friday as business days with no public
  holiday calendar in v1 — the brief does not supply a holiday data source,
  and building/maintaining one is out of proportion for v1.
- Public enquiry form spam protection (Phase 6) is a honeypot field plus
  per-IP-hash rate limiting inside the insert RPC, no third-party CAPTCHA
  dependency in v1.
- `next_enquiry_reference()`'s mechanical counter-increment logic was
  extracted into `allocate_enquiry_reference()` (redefined via `create or
  replace` in the Phase 6 migration, not by editing Phase 1's file) so the
  public path can allocate a reference number too — an anonymous caller
  has no `venue_users` row, so `next_enquiry_reference()`'s own membership
  check would always reject it. `create_public_enquiry()` calls the shared
  helper directly and applies its own, different authorization model
  (venue must exist and be active, plus rate-limit/honeypot checks)
  instead.
- `create_public_enquiry()`'s use of the service-role client is a third,
  narrow, documented exception to "no service role key in a request-scoped
  path": an anonymous public submission has no user session at all to
  scope an RLS-scoped client to, so `app/api/public-enquiry/route.ts` uses
  the admin client purely to look up the enquiry's assigned owner and send
  the acknowledgement/notification emails after the RPC itself (which does
  the actual insert under its own SECURITY DEFINER checks) succeeds.
- CSV export and reference-number formatting are hand-rolled utilities, not
  third-party dependencies — both are one-function problems.
- RLS cross-venue denial tests are written as Vitest/TypeScript integration
  tests against a local Supabase Postgres instance, not pgTAP, to keep one
  test runner for the whole stack.
- `lib/types/database.types.ts` is generated from the live schema
  (`mcp__Supabase__generate_typescript_types` or `supabase gen types
  typescript`) and is never hand-edited going forward, with one narrow,
  documented exception: the generator (PostgREST 14.15, as observed against
  the live project) omits `| null` from any RPC function argument that has
  no SQL-level default, even when the function body treats it as optional —
  Postgres itself allows NULL for any function parameter regardless of
  declared type, since parameters carry no NOT NULL constraint the way
  columns do. `create_public_enquiry`'s six genuinely-optional args
  (contact_email, preferred_date, headcount_estimate, event_type_id,
  brief_description, honeypot) are hand-widened to `| null` in the
  generated file so call sites don't need a type-assertion cast; a future
  wholesale regeneration will drop this widening and needs it reapplied
  (see the comment left in the file itself). Params with an actual SQL
  default (`confirm_enquiry.p_final_headcount`,
  `update_enquiry_status.p_reason_id`) don't need this — the generator
  already marks those optional, so callers pass `?? undefined`, not `??
  null`.
- A dedicated Supabase project ("The Queens", `zbzoymnunjwwgwgklaui`,
  `ap-southeast-2`) now exists and all seven migrations (Phases 1–6 plus a
  `p7_security_hardening` follow-up) are applied to it. The hardening
  migration fixes two `get_advisors` findings surfaced on first apply:
  `allocate_enquiry_reference()` was `SECURITY DEFINER` with no
  authorization check of its own, reachable directly by any caller
  (including `anon`) via PostgREST's default RPC exposure — it relied
  entirely on its two callers' checks, which a direct call bypassed
  outright, letting anyone burn/inflate a venue's enquiry-reference counter
  by venue_id alone. Direct `EXECUTE` is now revoked from `public`/`anon`/
  `authenticated`; both legitimate callers keep working since a
  `SECURITY DEFINER` function's owner retains implicit execute rights.
  The migration also adds the missing `set search_path = public` to four
  functions that had been the only ones in the schema without it
  (`set_updated_at`, `enforce_quote_immutability`,
  `enforce_quote_line_items_immutability`, `add_business_days`). The
  remaining `get_advisors` output (RLS-enabled-no-policy on
  `venue_counters`/`public_enquiry_rate_limit`, and anon/authenticated
  EXECUTE visibility on `auth_venue_ids`/`auth_venue_role`/the public-form
  RPCs/the trigger functions) is intentional or self-gating by design — see
  the inline comments at each definition — and was left as-is.
- The RLS cross-venue denial suite (`tests/rls/*.test.ts`) is still only
  ever run against a disposable Postgres instance (CI's `supabase start`),
  never against the live project: the suite creates real auth users and
  random-slug venues via the service-role client with no teardown, and
  running it against "The Queens" would permanently seed a real venue's
  production database with fake test data. Verifying against the live
  project only ever meant applying the real migrations and regenerating
  real types from it, both done above — not executing the test suite there.
- `/api/export/[resource]/route.ts` (referenced in the architecture but not
  wired up when Phase 6 shipped) now implements the `enquiries` resource,
  reusing `listPipelineEnquiries` and the existing `toCsv()` helper — same
  RLS-scoped query and filters the pipeline view uses, so an export can
  never exceed what the view itself would show. Additional resources are
  added the same way: wire in an existing list query, never a bespoke one.
