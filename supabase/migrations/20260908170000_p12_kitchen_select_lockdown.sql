-- Phase 12: close the gap flagged on PR #4 (Codex review) — p11 excluded
-- 'kitchen' from enquiries_select/events_select, but every other table's
-- SELECT policy was still the blanket "any venue member" pattern used
-- before the kitchen role existed. A kitchen user could read every
-- contact's name/email/phone/notes directly, plus organisations, quotes,
-- payments, holds, activities, tasks, files, accommodation guest detail,
-- and venue_settings' bank/legal fields — defeating the "confirmed
-- bookings and catering detail only" restriction get_kitchen_bookings()
-- was meant to enforce.
--
-- Venue-config/lookup tables (event_types, lost_reasons, spaces, packages,
-- booking_types, reply_templates) are left as-is: not customer or
-- financial PII, and there's no stated reason to hide venue configuration
-- from kitchen. event_dietary_requirements/event_spaces/event_packages
-- are also left open — that's the catering/space detail kitchen is
-- actually meant to see.

drop policy contacts_select on contacts;
create policy contacts_select on contacts for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy organisations_select on organisations;
create policy organisations_select on organisations for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy quotes_select on quotes;
create policy quotes_select on quotes for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy quote_line_items_select on quote_line_items;
create policy quote_line_items_select on quote_line_items for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy payments_select on payments;
create policy payments_select on payments for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy holds_select on holds;
create policy holds_select on holds for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy activities_select on activities;
create policy activities_select on activities for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy tasks_select on tasks;
create policy tasks_select on tasks for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy files_select on files;
create policy files_select on files for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy accommodation_blocks_select on accommodation_blocks;
create policy accommodation_blocks_select on accommodation_blocks for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy accommodation_bookings_select on accommodation_bookings;
create policy accommodation_bookings_select on accommodation_bookings for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy venue_settings_select on venue_settings;
create policy venue_settings_select on venue_settings for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');
