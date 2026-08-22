-- Local development demo data only. Never applied to a real environment,
-- never required for the app to function (DECISIONS.md). Everything here
-- is obviously fake so it can never be mistaken for real venue
-- configuration — contrast with supabase/seed/onboard-first-venue.sql,
-- which uses The Queens Hotel Gladstone's real, brief-confirmed identity.
--
-- Before running: sign up a local dev user (e.g. via the app's own login
-- page against `supabase start`), find their id in auth.users, and replace
-- 'REPLACE_WITH_DEV_USER_ID' below.

with demo_venue as (
  insert into venues (name, trading_name, slug, address, timezone, brand_config)
  values (
    'DEMO VENUE (fake data)',
    'Demo Venue',
    'demo-venue',
    '1 Fake Street, Nowhere',
    'Australia/Brisbane',
    '{}'::jsonb
  )
  returning id
),
demo_admin as (
  insert into venue_users (user_id, venue_id, role)
  select 'REPLACE_WITH_DEV_USER_ID'::uuid, id, 'admin' from demo_venue
),
demo_event_types as (
  insert into event_types (venue_id, name, display_order)
  select id, name, ordinality
  from demo_venue, unnest(array['Wedding (demo)', 'Corporate (demo)', 'Birthday (demo)']) with ordinality as t(name, ordinality)
  returning id, name
),
demo_lost_reasons as (
  insert into lost_reasons (venue_id, label, display_order)
  select id, label, ordinality
  from demo_venue, unnest(array['Went elsewhere (demo)', 'Budget (demo)', 'Date unavailable (demo)']) with ordinality as t(label, ordinality)
)
insert into enquiries (venue_id, reference_number, source, contact_name, contact_phone, contact_email, event_type_id, preferred_date, headcount_estimate, status)
select
  demo_venue.id,
  'DEMO-000001',
  'phone',
  'Jane Sample (demo)',
  '0400 000 000',
  'demo@example.com',
  demo_event_types.id,
  current_date + interval '30 days',
  80,
  'new'
from demo_venue
join demo_event_types on demo_event_types.name = 'Wedding (demo)'
limit 1;
