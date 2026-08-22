-- Phase 6: the public, unauthenticated enquiry form. `anon` already cannot
-- write to `enquiries` directly — enquiries_insert's `auth_venue_role(...)`
-- check resolves to null for a caller with no session, which never
-- matches ('admin','manager','coordinator') — so no new "block anon" rule
-- is needed there. What anon genuinely lacks is any way to *read* a
-- venue's public-facing name/branding or event-type list (those SELECT
-- policies are membership-gated too), and a safe way to insert one row.
-- Both are exposed here as narrow SECURITY DEFINER RPCs, granted to
-- `anon` explicitly, rather than widening any table's RLS policy.

-- ---------------------------------------------------------------------------
-- Reference-number allocation is split so the public path can use the
-- mechanical part without the membership check next_enquiry_reference()
-- requires (anon has no venue_users row to check). next_enquiry_reference()
-- itself is redefined here (create or replace — the Phase 1 migration file
-- is not edited) to delegate to the new shared helper.
-- ---------------------------------------------------------------------------

create or replace function allocate_enquiry_reference(p_venue_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq bigint;
  v_slug text;
begin
  insert into venue_counters (venue_id, enquiry_seq)
  values (p_venue_id, 1)
  on conflict (venue_id) do update set enquiry_seq = venue_counters.enquiry_seq + 1
  returning enquiry_seq into v_seq;

  select upper(slug) into v_slug from venues where id = p_venue_id;

  return v_slug || '-' || lpad(v_seq::text, 6, '0');
end;
$$;

create or replace function next_enquiry_reference(p_venue_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_venue_id not in (select auth_venue_ids())
     or auth_venue_role(p_venue_id) not in ('admin', 'manager', 'coordinator') then
    raise exception 'not authorized to allocate a reference number for venue %', p_venue_id;
  end if;

  return allocate_enquiry_reference(p_venue_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting: capped submissions per IP per venue per hour.
-- ---------------------------------------------------------------------------

create table public_enquiry_rate_limit (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  venue_id uuid not null references venues (id) on delete cascade,
  window_start timestamptz not null,
  count int not null default 0,
  unique (ip_hash, venue_id, window_start)
);

alter table public_enquiry_rate_limit enable row level security;
-- No policies at all: this table is purely internal bookkeeping for the
-- create_public_enquiry() function below (SECURITY DEFINER, bypasses RLS)
-- and is never read or written by any client directly.

-- ---------------------------------------------------------------------------
-- Public venue lookups (name/branding, event types) — read-only, narrow,
-- and the only way `anon` can see anything about a venue at all.
-- ---------------------------------------------------------------------------

create or replace function get_public_venue_info(p_slug text)
returns table (venue_id uuid, name text, brand_config jsonb, privacy_notice_url text)
language sql
security definer
stable
set search_path = public
as $$
  select v.id, v.name, v.brand_config, vs.privacy_notice_url
  from venues v
  join venue_settings vs on vs.venue_id = v.id
  where v.slug = p_slug and v.active = true;
$$;

create or replace function get_public_event_types(p_slug text)
returns table (id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select et.id, et.name
  from event_types et
  join venues v on v.id = et.venue_id
  where v.slug = p_slug and v.active = true and et.active = true
  order by et.display_order;
$$;

-- Mirrors lib/automation/business-days.ts's Mon-Fri semantics (see
-- DECISIONS.md — no public-holiday calendar in v1) so the public path's
-- follow-up task lands on the same rule as the internal capture path's.
create or replace function add_business_days(p_start date, p_days int)
returns date
language plpgsql
immutable
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

-- ---------------------------------------------------------------------------
-- The public enquiry insert itself. Everything the SQL layer can do on
-- creation (brief 6.1) happens here atomically: reference number, default
-- owner assignment, and the +1-business-day follow-up task. Email sending
-- (acknowledgement to contact, notification to owner) cannot happen from
-- SQL — the caller (app/api/public-enquiry/route.ts) does that afterward
-- using the returned enquiry id, via the service-role client (a third,
-- narrow, documented exception in DECISIONS.md: there is no user session
-- to scope an RLS-scoped client to for an anonymous submission).
-- ---------------------------------------------------------------------------

create or replace function create_public_enquiry(
  p_venue_slug text,
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_preferred_date date,
  p_headcount_estimate int,
  p_event_type_id uuid,
  p_brief_description text,
  p_ip_hash text,
  p_honeypot text
)
returns table (enquiry_id uuid, reference_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_window timestamptz;
  v_count int;
  v_reference text;
  v_enquiry_id uuid;
  v_default_owner_id uuid;
  v_followup_days int;
begin
  -- A filled-in honeypot means a bot. Report success without doing
  -- anything real, rather than telling it what tripped the check.
  if p_honeypot is not null and length(trim(p_honeypot)) > 0 then
    return;
  end if;

  if p_contact_name is null or length(trim(p_contact_name)) = 0 then
    raise exception 'contact name is required';
  end if;
  if p_contact_phone is null or length(trim(p_contact_phone)) = 0 then
    raise exception 'contact phone is required';
  end if;

  select id into v_venue_id from venues where slug = p_venue_slug and active = true;
  if v_venue_id is null then
    raise exception 'unknown venue';
  end if;

  v_window := date_trunc('hour', now());
  insert into public_enquiry_rate_limit (ip_hash, venue_id, window_start, count)
  values (p_ip_hash, v_venue_id, v_window, 1)
  on conflict (ip_hash, venue_id, window_start) do update set count = public_enquiry_rate_limit.count + 1
  returning count into v_count;

  if v_count > 5 then
    raise exception 'too many submissions from this address recently — please try again later';
  end if;

  select vs.default_owner_user_id, vs.default_followup_new_enquiry_business_days
    into v_default_owner_id, v_followup_days
  from venue_settings vs where vs.venue_id = v_venue_id;

  v_reference := allocate_enquiry_reference(v_venue_id);

  insert into enquiries (
    venue_id, reference_number, source, contact_name, contact_phone, contact_email,
    event_type_id, preferred_date, headcount_estimate, brief_description, owner_user_id
  )
  values (
    v_venue_id, v_reference, 'website', p_contact_name, p_contact_phone, nullif(p_contact_email, ''),
    p_event_type_id, p_preferred_date, p_headcount_estimate, p_brief_description, v_default_owner_id
  )
  returning id into v_enquiry_id;

  insert into tasks (venue_id, enquiry_id, title, due_date, assignee_user_id, source)
  values (
    v_venue_id, v_enquiry_id, 'Follow up with ' || p_contact_name,
    add_business_days(current_date, coalesce(v_followup_days, 1)), v_default_owner_id, 'auto_new_enquiry'
  );

  return query select v_enquiry_id, v_reference;
end;
$$;

grant execute on function get_public_venue_info(text) to anon;
grant execute on function get_public_event_types(text) to anon;
grant execute on function create_public_enquiry(text, text, text, text, date, int, uuid, text, text, text) to anon;
