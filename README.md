# Functions Manager

A functions enquiry and booking platform, built first for The Queens Hotel
Gladstone and designed as a multi-venue product from the ground up. See
`DECISIONS.md` for the judgment calls made where the build brief was
ambiguous.

Shipped in phases (see the repo's commit history): capture & pipeline,
availability (spaces/holds/calendar), quoting, events & delivery (run
sheets), automation & reporting, and the public enquiry form — auth and
venue-scoped RLS underpin all of it.

Environment variables (`.env.example`), database migrations
(`supabase/migrations/`), and the venue onboarding script
(`supabase/seed/onboard-first-venue.sql`) are all in place; what's
outstanding is provisioning the actual Supabase project (see below) and
running the deferred end-to-end verification pass once that's unblocked.

## Stack

Next.js (App Router) + TypeScript, Supabase (Postgres + Auth + Storage),
authorization enforced entirely in Postgres row level security (never in
application code), Tailwind, Resend for transactional email. See
`DECISIONS.md` for library choices made along the way.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project + Resend details
npm run dev
```

**Supabase.** A dedicated project (region `ap-southeast-2`) is required —
see `supabase/migrations/` for the schema. Apply migrations with the
Supabase CLI (`supabase db push`) or `mcp__Supabase__apply_migration`, then
regenerate `lib/types/database.types.ts` (see the note at the top of that
file — it currently ships as a documented placeholder, not generated,
because project provisioning is blocked on an overdue invoice on the
target Supabase organization).

**Onboarding the first venue.** Adding a venue is a deliberate seeded
insert, not a signup flow (see `DECISIONS.md`) — run
`supabase/seed/onboard-first-venue.sql` with the service role after
inviting the first admin user. `supabase/seed/dev-seed.sql` is optional,
local-only, obviously-fake demo data — never required for the app to run.

**Automation cron.** `app/api/cron/automation/route.ts` runs daily via
Vercel Cron (`vercel.json`) and expects a `CRON_SECRET` matching Vercel's
own request header — set it in your Vercel project's environment
variables (see `.env.example`).

**Public enquiry form.** Each venue's form lives at `/enquire/<slug>`
(the venue's `slug` column) — see the embed snippet on its Admin →
Venue settings page.

## Testing

```bash
npm run typecheck
npm run lint
npm run test:unit   # pure-function tests, no DB required

# RLS cross-venue denial tests (mandated by the build brief) — needs a
# local Supabase instance:
supabase start
supabase status -o env   # use the output to fill in .env.test (see .env.test.example)
npm run test:rls
```

## Design

Visual design/wireframes are generated separately via Claude Design rather
than hand-built in this codebase — see the plan history for the prompt
used to generate them.
