-- The public enquiry and accommodation booking routes now call these with the
-- service-role client, so they no longer need to be callable with the public
-- (anon) key. Left open, anyone could call them straight through PostgREST with
-- a made-up p_ip_hash (skipping the rate limit) or, for bookings, a made-up
-- p_rms_booking_reference (using up a block's rooms with no RMS reservation).
revoke execute on function public.create_public_enquiry(text, text, text, text, date, integer, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_public_accommodation_booking(text, text, text, text, date, date, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_public_enquiry(text, text, text, text, date, integer, uuid, text, text, text) to service_role;
grant execute on function public.record_public_accommodation_booking(text, text, text, text, date, date, text, text, text, text) to service_role;

-- Counts a public booking attempt before RMS is called, atomically, so several
-- requests at once can't all slip under the cap and each reach RMS. Kept on its
-- own key ('pre:' + ip hash) so it doesn't double-count with the counter
-- record_public_accommodation_booking() keeps for recorded bookings.
create or replace function reserve_public_accommodation_attempt(p_block_id uuid, p_ip_hash text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public_accommodation_rate_limit (ip_hash, block_id, window_start, count)
  values ('pre:' || p_ip_hash, p_block_id, date_trunc('hour', now()), 1)
  on conflict (ip_hash, block_id, window_start) do update set count = public_accommodation_rate_limit.count + 1
  returning count;
$$;
revoke execute on function public.reserve_public_accommodation_attempt(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_public_accommodation_attempt(uuid, text) to service_role;
