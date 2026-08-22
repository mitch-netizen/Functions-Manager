-- Phase 8 (addendum): guest self-service accommodation booking against a
-- staff-created room block, backed by a real RMS Cloud integration. The
-- OpenTable half of this addendum (a manual task reminding staff to block
-- tables, since the venue has no OpenTable partner/API access) is app-code
-- only and needs no schema. See DECISIONS.md for the full reasoning.

-- ---------------------------------------------------------------------------
-- RMS credentials — a dedicated table, not columns on venue_settings.
--
-- venue_settings' existing SELECT policy is "any venue member" (deliberately
-- unrestricted, since it only ever held non-secret operational timing
-- defaults). Storing a real third-party API secret there would leak it to
-- every coordinator/viewer in the venue. This table gets its own
-- admin/manager-only policies instead, the same tier of trust as
-- SUPABASE_SERVICE_ROLE_KEY/RESEND_API_KEY.
-- ---------------------------------------------------------------------------

create table venue_rms_credentials (
  venue_id uuid primary key references venues (id) on delete cascade,
  rms_agent_id text,
  rms_client_id text,
  rms_api_key text,
  updated_at timestamptz not null default now()
);

create trigger venue_rms_credentials_set_updated_at
  before update on venue_rms_credentials
  for each row execute function set_updated_at();

alter table venue_rms_credentials enable row level security;

create policy venue_rms_credentials_select on venue_rms_credentials for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));
create policy venue_rms_credentials_write on venue_rms_credentials for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

-- ---------------------------------------------------------------------------
-- Accommodation room blocks + guest bookings against them.
-- ---------------------------------------------------------------------------

create type accommodation_block_status as enum ('active', 'closed', 'expired');
create type accommodation_booking_status as enum ('confirmed', 'cancelled');

-- The venue-side ledger of "how many rooms have we told guests they can
-- book" for one confirmed event. RMS remains the actual source of truth for
-- the physical rooms themselves (rooms_held is never synced as a native
-- "block" primitive in RMS — this table is Functions Manager's own
-- allocation, checked against RMS's live availability at booking time and
-- backstopped by the capacity check in record_public_accommodation_booking
-- below).
create table accommodation_blocks (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  event_id uuid not null,
  rms_room_type_code text not null,
  rooms_held int not null check (rooms_held > 0),
  check_in_window_start date not null,
  check_in_window_end date not null,
  nights_allowed int not null default 1 check (nights_allowed > 0),
  -- Unguessable public identifier for the guest-facing booking link —
  -- deliberately not derived from the event/venue id or any sequence.
  public_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status accommodation_block_status not null default 'active',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (venue_id, id),
  foreign key (venue_id, event_id) references events (venue_id, id),
  check (check_in_window_end >= check_in_window_start)
);

create index accommodation_blocks_event_idx on accommodation_blocks (event_id);

-- One row per guest's actual RMS reservation against a block.
create table accommodation_bookings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  block_id uuid not null references accommodation_blocks (id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  room_type_code text not null,
  rms_booking_reference text not null,
  status accommodation_booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);

create index accommodation_bookings_block_idx on accommodation_bookings (block_id, status);

-- Same shape/purpose as public_enquiry_rate_limit (Phase 6): capped
-- submissions per IP per block per hour.
create table public_accommodation_rate_limit (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  block_id uuid not null references accommodation_blocks (id) on delete cascade,
  window_start timestamptz not null,
  count int not null default 0,
  unique (ip_hash, block_id, window_start)
);

-- ---------------------------------------------------------------------------
-- Public (anon) RPCs — the only way an anonymous guest sees or writes
-- anything here, mirroring create_public_enquiry's pattern exactly: no
-- direct table policy for anon, two narrow SECURITY DEFINER functions.
-- ---------------------------------------------------------------------------

create or replace function get_public_accommodation_block(p_token text)
returns table (
  block_id uuid,
  venue_id uuid,
  venue_name text,
  brand_config jsonb,
  room_type_code text,
  check_in_window_start date,
  check_in_window_end date,
  nights_allowed int,
  rooms_remaining int
)
language sql
security definer
stable
set search_path = public
as $$
  select
    b.id,
    b.venue_id,
    v.name,
    v.brand_config,
    b.rms_room_type_code,
    b.check_in_window_start,
    b.check_in_window_end,
    b.nights_allowed,
    greatest(
      b.rooms_held - (
        select count(*) from accommodation_bookings ab
        where ab.block_id = b.id and ab.status = 'confirmed'
      ),
      0
    )::int
  from accommodation_blocks b
  join venues v on v.id = b.venue_id
  where b.public_token = p_token and b.status = 'active';
$$;

-- Everything the SQL layer can atomically guarantee happens here: honeypot
-- short-circuit, rate limiting, the block's active/window checks, and the
-- capacity backstop — independent of whatever the app layer already
-- verified against RMS's live availability, this is what actually prevents
-- overselling the block under concurrent guests. `select ... for update`
-- serializes concurrent callers against the same block so the
-- count-then-insert sequence can't race.
create or replace function record_public_accommodation_booking(
  p_block_token text,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_check_in date,
  p_check_out date,
  p_room_type_code text,
  p_rms_booking_reference text,
  p_ip_hash text,
  p_honeypot text
)
returns table (booking_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block accommodation_blocks;
  v_window timestamptz;
  v_count int;
  v_confirmed_count int;
  v_booking_id uuid;
begin
  if p_honeypot is not null and length(trim(p_honeypot)) > 0 then
    return;
  end if;

  if p_guest_name is null or length(trim(p_guest_name)) = 0 then
    raise exception 'guest name is required';
  end if;

  select * into v_block from accommodation_blocks where public_token = p_block_token and status = 'active';
  if v_block.id is null then
    raise exception 'unknown or inactive accommodation block';
  end if;

  if p_check_in < v_block.check_in_window_start or p_check_in > v_block.check_in_window_end then
    raise exception 'check-in date is outside the allowed window for this block';
  end if;

  if p_check_out - p_check_in > v_block.nights_allowed then
    raise exception 'stay exceeds the maximum nights allowed for this block';
  end if;

  v_window := date_trunc('hour', now());
  insert into public_accommodation_rate_limit (ip_hash, block_id, window_start, count)
  values (p_ip_hash, v_block.id, v_window, 1)
  on conflict (ip_hash, block_id, window_start) do update set count = public_accommodation_rate_limit.count + 1
  returning count into v_count;

  if v_count > 5 then
    raise exception 'too many booking attempts from this address recently — please try again later';
  end if;

  perform 1 from accommodation_blocks where id = v_block.id for update;

  select count(*) into v_confirmed_count from accommodation_bookings where block_id = v_block.id and status = 'confirmed';
  if v_confirmed_count >= v_block.rooms_held then
    raise exception 'this room block is fully booked';
  end if;

  insert into accommodation_bookings (
    venue_id, block_id, guest_name, guest_email, guest_phone, check_in, check_out, room_type_code, rms_booking_reference
  )
  values (
    v_block.venue_id, v_block.id, p_guest_name, nullif(p_guest_email, ''), nullif(p_guest_phone, ''),
    p_check_in, p_check_out, p_room_type_code, p_rms_booking_reference
  )
  returning id into v_booking_id;

  return query select v_booking_id;
end;
$$;

grant execute on function get_public_accommodation_block(text) to anon;
grant execute on function record_public_accommodation_booking(text, text, text, text, date, date, text, text, text, text) to anon;

-- ---------------------------------------------------------------------------
-- Row level security (internal/staff access)
-- ---------------------------------------------------------------------------

alter table accommodation_blocks enable row level security;
alter table accommodation_bookings enable row level security;
alter table public_accommodation_rate_limit enable row level security;
-- public_accommodation_rate_limit has no client-facing policy at all, same
-- reasoning as public_enquiry_rate_limit: purely internal bookkeeping for
-- the SECURITY DEFINER function above.

create policy accommodation_blocks_select on accommodation_blocks for select
  using (venue_id in (select auth_venue_ids()));
create policy accommodation_blocks_write on accommodation_blocks for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

-- accommodation_bookings: staff can see bookings against their venue's
-- blocks; no direct client insert policy at all — rows are only ever
-- created via record_public_accommodation_booking() above.
create policy accommodation_bookings_select on accommodation_bookings for select
  using (venue_id in (select auth_venue_ids()));
