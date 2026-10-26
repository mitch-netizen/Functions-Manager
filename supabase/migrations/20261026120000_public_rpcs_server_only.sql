-- The public enquiry and accommodation booking routes now call these with the
-- service-role client, so they no longer need to be callable with the public
-- (anon) key. Left open, anyone could call them straight through PostgREST with
-- a made-up p_ip_hash (skipping the rate limit) or, for bookings, a made-up
-- p_rms_booking_reference (using up a block's rooms with no RMS reservation).
revoke execute on function public.create_public_enquiry(text, text, text, text, date, integer, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_public_accommodation_booking(text, text, text, text, date, date, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_public_enquiry(text, text, text, text, date, integer, uuid, text, text, text) to service_role;
grant execute on function public.record_public_accommodation_booking(text, text, text, text, date, date, text, text, text, text) to service_role;
