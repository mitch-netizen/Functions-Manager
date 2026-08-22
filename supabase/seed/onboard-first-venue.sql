-- Onboards The Queens Hotel Gladstone as the first venue. This is NOT run
-- automatically — per DECISIONS.md, adding a venue is a deliberate,
-- one-off seeded insert, run with the service role (e.g. via the Supabase
-- SQL editor) after the Phase 1 migration has been applied.
--
-- Identity fields below (name, address, brand colours/fonts) come directly
-- from the build brief and are real. ABN and legal entity name are left
-- null — they are still open items (brief section 12, #8) — fill them in
-- via Admin -> Venue settings once Mitch confirms them, not here.
--
-- Before running: create/invite the first admin user via Supabase Auth,
-- find their id (select id from auth.users where email = '...'), and
-- replace 'REPLACE_WITH_ADMIN_USER_ID' below with it.

with new_venue as (
  insert into venues (name, trading_name, slug, address, timezone, brand_config)
  values (
    'The Queens Hotel Gladstone',
    'The Queens',
    'queens-gladstone',
    '125 Goondoon Street, Gladstone',
    'Australia/Brisbane',
    jsonb_build_object(
      'headingFont', 'Playfair Display',
      'headingWeight', 700,
      'bodyFont', 'Montserrat',
      'goldColor', '#c8a24a',
      'blackColor', '#0d0d0d',
      'charcoalColor', '#161616',
      'panelColor', '#1e1c18'
    )
  )
  returning id
)
insert into venue_users (user_id, venue_id, role)
select 'REPLACE_WITH_ADMIN_USER_ID'::uuid, id, 'admin' from new_venue;
