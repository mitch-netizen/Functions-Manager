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
  table (`rule_key` + `subject_table` + `subject_id`, unique constraint),
  not per-rule dedupe flags scattered across domain tables.
- Business-day math treats Monday–Friday as business days with no public
  holiday calendar in v1 — the brief does not supply a holiday data source,
  and building/maintaining one is out of proportion for v1.
- Public enquiry form spam protection (Phase 6) is a honeypot field plus
  per-IP-hash rate limiting inside the insert RPC, no third-party CAPTCHA
  dependency in v1.
- CSV export and reference-number formatting are hand-rolled utilities, not
  third-party dependencies — both are one-function problems.
- RLS cross-venue denial tests are written as Vitest/TypeScript integration
  tests against a local Supabase Postgres instance, not pgTAP, to keep one
  test runner for the whole stack.
- `lib/types/database.types.ts` must be generated from the live schema
  (`mcp__Supabase__generate_typescript_types` or `supabase gen types
  typescript`) and is never hand-edited going forward. It currently ships
  as an explicitly-labelled placeholder because Supabase project
  provisioning for this workspace is blocked on an overdue invoice on the
  "FlowLab Solutions" organization — regenerate and replace it as the first
  step once a project exists and the Phase 1 migration has been applied.
