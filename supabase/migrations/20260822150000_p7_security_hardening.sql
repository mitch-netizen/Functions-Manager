-- Phase 7 (hardening, post-deploy): findings from get_advisors after
-- applying the live schema for the first time against a real project.
--
-- 1. allocate_enquiry_reference() is SECURITY DEFINER with no
--    authorization check of its own — it relies on its two callers
--    (next_enquiry_reference(), which checks venue membership/role, and
--    create_public_enquiry(), which checks the venue exists/is active plus
--    rate-limiting) to gate access. Supabase exposes every public-schema
--    function via PostgREST RPC by default, so without this revoke, any
--    caller (including anon) could invoke it directly with an arbitrary
--    venue_id and burn/inflate that venue's enquiry_seq counter, bypassing
--    both callers' checks entirely. Revoking direct EXECUTE closes that
--    path; the function's owner retains implicit execute rights, so both
--    SECURITY DEFINER callers keep working unchanged.
revoke execute on function allocate_enquiry_reference(uuid) from public, anon, authenticated;

-- 2. Four functions were missing `set search_path`, unlike every other
--    function in the schema — a role could otherwise shadow an unqualified
--    identifier via a search_path manipulation. None of these are
--    SECURITY DEFINER, so the risk is low, but there's no reason for them
--    to be the exception.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function enforce_quote_immutability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'cannot delete quote % once it has left draft status', old.id;
    end if;
    return old;
  end if;

  if old.status <> 'draft' then
    if new.subtotal <> old.subtotal
       or new.gst_amount <> old.gst_amount
       or new.total <> old.total
       or new.minimum_spend_applied is distinct from old.minimum_spend_applied
       or new.valid_until is distinct from old.valid_until
       or new.enquiry_id <> old.enquiry_id
       or new.version <> old.version then
      raise exception 'quote % is not editable once sent — create a new version instead', old.id;
    end if;
  end if;

  return new;
end;
$$;

create or replace function enforce_quote_line_items_immutability()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_status quote_status;
begin
  select status into v_status from quotes where id = coalesce(new.quote_id, old.quote_id);
  if v_status is not null and v_status <> 'draft' then
    raise exception 'cannot modify line items on a quote that is not in draft status';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function add_business_days(p_start date, p_days int)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  v_date date := p_start;
  v_remaining int := p_days;
begin
  while v_remaining > 0 loop
    v_date := v_date + 1;
    if extract(dow from v_date) not in (0, 6) then
      v_remaining := v_remaining - 1;
    end if;
  end loop;
  return v_date;
end;
$$;
