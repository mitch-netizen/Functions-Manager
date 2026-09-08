-- Phase 10: rename venue_role's enum labels to match the real role names
-- confirmed against the actual Queens Gladstone team (setup doc §3):
-- manager -> functions_manager, coordinator -> duty_manager,
-- viewer -> executive_readonly, plus a new 'kitchen' role (read-only,
-- confirmed-bookings-and-catering-only — see p11 for its restricted RLS).
--
-- Isolated into its own migration file: ALTER TYPE ... ADD VALUE cannot be
-- used in the same transaction that adds it (PostgreSQL restriction), and
-- every migration file runs as one transaction, so 'kitchen' cannot be
-- referenced in any policy/function until this file has committed. p11
-- does all of that policy/function work in a second transaction.
--
-- RENAME VALUE only changes the type's labels — it does NOT touch the
-- string literals already baked into existing policies/functions (e.g.
-- `auth_venue_role(venue_id) in ('admin', 'manager')`), which would start
-- failing to cast the moment 'manager' stops being a valid label. p11
-- drops and recreates every one of those with the renamed labels.

alter type venue_role rename value 'manager' to 'functions_manager';
alter type venue_role rename value 'coordinator' to 'duty_manager';
alter type venue_role rename value 'viewer' to 'executive_readonly';
alter type venue_role add value 'kitchen';
