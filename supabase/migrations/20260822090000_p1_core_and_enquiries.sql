-- Phase 1: core multi-venue schema, auth/RLS scaffolding, and the enquiry
-- capture + pipeline domain. See DECISIONS.md for the judgment calls behind
-- the shapes below.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_user_id uuid references auth.users (id),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_venue_record_idx on audit_log (venue_id, table_name, record_id);

-- SECURITY DEFINER: audit rows must exist regardless of the acting user's
-- own write permissions, and no policy grants direct client INSERT on
-- audit_log at all (see RLS section below).
create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_record_id uuid;
begin
  v_venue_id := coalesce((to_jsonb(new)->>'venue_id')::uuid, (to_jsonb(old)->>'venue_id')::uuid);
  v_record_id := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);

  insert into audit_log (venue_id, table_name, record_id, action, actor_user_id, before, after)
  values (
    v_venue_id,
    tg_table_name,
    v_record_id,
    lower(tg_op),
    auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- Venues, venue settings, venue membership/roles
-- ---------------------------------------------------------------------------

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text,
  slug text not null unique,
  address text,
  abn text,
  timezone text not null default 'Australia/Brisbane',
  brand_config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 1:1 runtime configuration, kept separate from venue identity so it can be
-- auto-created empty (nullable throughout) the moment a venue exists, with
-- no fake-filled defaults masquerading as real configuration.
create table venue_settings (
  venue_id uuid primary key references venues (id) on delete cascade,
  legal_entity_name text,
  gst_rate numeric(5, 4) not null default 0.10,
  default_tentative_hold_days int not null default 14,
  default_followup_new_enquiry_business_days int not null default 1,
  default_followup_proposal_sent_business_days int not null default 3,
  stale_enquiry_days int not null default 7,
  hold_expiry_warning_days int not null default 3,
  final_details_days_before_event int not null default 14,
  final_numbers_days_before_event int not null default 7,
  default_owner_user_id uuid references auth.users (id),
  privacy_notice_url text,
  updated_at timestamptz not null default now()
);

create trigger venue_settings_set_updated_at
  before update on venue_settings
  for each row execute function set_updated_at();

create or replace function create_venue_settings_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into venue_settings (venue_id) values (new.id);
  return new;
end;
$$;

create trigger venues_after_insert_create_settings
  after insert on venues
  for each row execute function create_venue_settings_row();

-- Mirrors the subset of auth.users needed by RLS-scoped queries (owner
-- notification lookups, admin user listings, assignee display) — regular
-- clients cannot query auth.users directly, and using the service-role
-- client from a user-request action to read another user's email would
-- violate "no service role key in a request-scoped path".
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function handle_new_or_updated_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  return new;
end;
$$;

create trigger on_auth_user_created_or_updated
  after insert or update on auth.users
  for each row execute function handle_new_or_updated_auth_user();

create type venue_role as enum ('admin', 'manager', 'coordinator', 'viewer');

-- Global "admin" access is modeled as this role repeated per venue a user
-- administers, not a separate global-admin flag/table (DECISIONS.md).
create table venue_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  venue_id uuid not null references venues (id) on delete cascade,
  role venue_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, venue_id)
);

create index venue_users_user_idx on venue_users (user_id);
create index venue_users_venue_idx on venue_users (venue_id);

-- SECURITY DEFINER + STABLE: used inside RLS policies on every domain table.
-- Must not itself recurse through RLS on venue_users, hence definer.
create or replace function auth_venue_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select venue_id from venue_users where user_id = auth.uid();
$$;

create or replace function auth_venue_role(p_venue_id uuid)
returns venue_role
language sql
security definer
stable
set search_path = public
as $$
  select role from venue_users where user_id = auth.uid() and venue_id = p_venue_id;
$$;

-- ---------------------------------------------------------------------------
-- Venue-scoped configurable lookups (event types, lost reasons)
--
-- These are NOT hardcoded enums. This product is sold to venues whose event
-- types and lost-reason vocabulary are unknowable in advance, so they are
-- admin-managed data per venue, structurally identical to every other
-- domain table (venue_id + RLS), not special-cased as "just config".
-- ---------------------------------------------------------------------------

create table event_types (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (venue_id, name),
  -- lets other tables take a composite (venue_id, event_type_id) FK below,
  -- so an enquiry can never reference another venue's event type.
  unique (venue_id, id)
);

create table lost_reasons (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  label text not null,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (venue_id, label),
  unique (venue_id, id)
);

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------

create table venue_counters (
  venue_id uuid primary key references venues (id) on delete cascade,
  enquiry_seq bigint not null default 0
);

-- Atomic, concurrency-safe reference number allocation: a single
-- INSERT ... ON CONFLICT ... UPDATE is one statement, so no explicit lock
-- is needed to avoid two concurrent callers getting the same number.
-- SECURITY DEFINER (venue_counters has no client policy at all), so venue
-- membership is checked explicitly rather than relied on implicitly.
create or replace function next_enquiry_reference(p_venue_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq bigint;
  v_slug text;
begin
  if p_venue_id not in (select auth_venue_ids())
     or auth_venue_role(p_venue_id) not in ('admin', 'manager', 'coordinator') then
    raise exception 'not authorized to allocate a reference number for venue %', p_venue_id;
  end if;

  insert into venue_counters (venue_id, enquiry_seq)
  values (p_venue_id, 1)
  on conflict (venue_id) do update set enquiry_seq = venue_counters.enquiry_seq + 1
  returning enquiry_seq into v_seq;

  select upper(slug) into v_slug from venues where id = p_venue_id;

  return v_slug || '-' || lpad(v_seq::text, 6, '0');
end;
$$;

create type enquiry_source as enum
  ('phone', 'email', 'walk_in', 'website', 'social', 'referral', 'repeat');

create type enquiry_status as enum
  ('new', 'qualifying', 'proposal_sent', 'tentative', 'confirmed', 'completed', 'lost', 'cancelled');

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  reference_number text not null,
  source enquiry_source not null,
  contact_name text not null,
  contact_email text,
  contact_phone text not null,
  organisation text,
  event_type_id uuid,
  preferred_date date,
  date_flexible boolean not null default false,
  alternate_dates date[],
  headcount_estimate int,
  budget_indication numeric(10, 2),
  brief_description text,
  status enquiry_status not null default 'new',
  owner_user_id uuid references auth.users (id),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, reference_number),
  -- Composite FK (not just event_type_id -> event_types.id): guarantees an
  -- enquiry can never point at another venue's event type, not just that
  -- the id exists somewhere. NULLs (no event type chosen yet) are exempt
  -- under standard MATCH SIMPLE semantics.
  foreign key (venue_id, event_type_id) references event_types (venue_id, id)
);
-- space_preference_id is added in the Phase 2 migration once spaces exists.

create index enquiries_venue_status_idx on enquiries (venue_id, status);
create index enquiries_venue_owner_idx on enquiries (venue_id, owner_user_id);

create trigger enquiries_set_updated_at
  before update on enquiries
  for each row execute function set_updated_at();

create trigger enquiries_audit
  after insert or update or delete on enquiries
  for each row execute function audit_row_change();

-- Append-only. Reason is required when transitioning into lost/cancelled,
-- enforced here (not just in application code) so the constraint holds
-- regardless of write path.
create table enquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  venue_id uuid not null references venues (id),
  from_status enquiry_status,
  to_status enquiry_status not null,
  reason_id uuid,
  actor_user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint reason_required_on_terminal check (
    to_status not in ('lost', 'cancelled') or reason_id is not null
  ),
  -- Composite FK, same reasoning as enquiries.event_type_id above: a
  -- lost/cancelled reason must belong to the same venue as the enquiry.
  foreign key (venue_id, reason_id) references lost_reasons (venue_id, id)
);

create index enquiry_status_history_enquiry_idx on enquiry_status_history (enquiry_id, created_at);

-- Atomic status transition: updates enquiries.status and appends the history
-- row in one statement-level transaction (a single RPC call), so a status
-- change and its audit trail can never diverge.
--
-- SECURITY DEFINER because enquiry_status_history has no direct client
-- INSERT policy (it is append-only and only ever written here). Since a
-- definer function bypasses RLS entirely for the statements inside it, the
-- authorization check that enquiries_update's policy would normally provide
-- is re-implemented explicitly below rather than relied upon implicitly.
create or replace function update_enquiry_status(
  p_enquiry_id uuid,
  p_to_status enquiry_status,
  p_reason_id uuid default null
)
returns enquiries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enquiry enquiries;
  v_from_status enquiry_status;
  v_venue_id uuid;
begin
  select status, venue_id into v_from_status, v_venue_id from enquiries where id = p_enquiry_id;

  if v_from_status is null then
    raise exception 'enquiry % not found', p_enquiry_id;
  end if;

  if v_venue_id not in (select auth_venue_ids())
     or auth_venue_role(v_venue_id) not in ('admin', 'manager', 'coordinator') then
    raise exception 'not authorized to change status on enquiry %', p_enquiry_id;
  end if;

  if p_to_status in ('lost', 'cancelled') and p_reason_id is null then
    raise exception 'a reason is required when moving an enquiry to %', p_to_status;
  end if;

  update enquiries set status = p_to_status where id = p_enquiry_id
  returning * into v_enquiry;

  insert into enquiry_status_history (enquiry_id, venue_id, from_status, to_status, reason_id, actor_user_id)
  values (p_enquiry_id, v_venue_id, v_from_status, p_to_status, p_reason_id, auth.uid());

  return v_enquiry;
end;
$$;

-- ---------------------------------------------------------------------------
-- Activities (enquiry timeline) and tasks
--
-- event_id columns/FKs are added in the Phase 4 migration once `events`
-- exists; both tables require enquiry_id for now.
-- ---------------------------------------------------------------------------

create type activity_type as enum
  ('note', 'email_sent', 'email_received', 'call', 'meeting', 'site_visit', 'status_change', 'file_upload');

create table activities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  type activity_type not null,
  body text,
  actor_user_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index activities_enquiry_idx on activities (enquiry_id, created_at);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  title text not null,
  due_date date not null,
  assignee_user_id uuid references auth.users (id),
  completed boolean not null default false,
  completed_at timestamptz,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create index tasks_venue_assignee_idx on tasks (venue_id, assignee_user_id, completed, due_date);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table venues enable row level security;
alter table venue_settings enable row level security;
alter table venue_users enable row level security;
alter table event_types enable row level security;
alter table lost_reasons enable row level security;
alter table venue_counters enable row level security;
alter table enquiries enable row level security;
alter table enquiry_status_history enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table audit_log enable row level security;

-- profiles: a user always sees their own; otherwise only profiles of people
-- who share at least one venue with them (needed for owner-notification
-- lookups and the admin Users screen, never a full directory of all users).
create policy profiles_select_self on profiles for select
  using (id = auth.uid());

create policy profiles_select_venue_co_members on profiles for select
  using (
    id in (
      select vu.user_id from venue_users vu
      where vu.venue_id in (select auth_venue_ids())
    )
  );

-- venues: readable by members, writable by admin/manager of that venue.
create policy venues_select on venues for select
  using (id in (select auth_venue_ids()));

create policy venues_update on venues for update
  using (id in (select auth_venue_ids()) and auth_venue_role(id) in ('admin', 'manager'))
  with check (id in (select auth_venue_ids()) and auth_venue_role(id) in ('admin', 'manager'));

-- Venue creation and the first venue_users row are deliberately not exposed
-- via a client-writable policy: onboarding a new venue is a seeded DB
-- insert performed with the service role (DECISIONS.md), since there is by
-- definition no admin yet to authorize it through RLS.

-- venue_settings: readable by members, writable by admin/manager.
create policy venue_settings_select on venue_settings for select
  using (venue_id in (select auth_venue_ids()));

create policy venue_settings_update on venue_settings for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

-- venue_users: a user always sees their own memberships; admins manage
-- membership for venues they administer.
create policy venue_users_select_self on venue_users for select
  using (user_id = auth.uid());

create policy venue_users_select_admin on venue_users for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) = 'admin');

create policy venue_users_insert_admin on venue_users for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) = 'admin');

create policy venue_users_update_admin on venue_users for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) = 'admin')
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) = 'admin');

create policy venue_users_delete_admin on venue_users for delete
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) = 'admin');

-- Standard per-table pattern used by every remaining domain table below:
-- select = any venue member; write = admin/manager/coordinator, except
-- config tables (event_types, lost_reasons) which are admin/manager only,
-- matching "coordinator cannot alter packages/pricing"-style restrictions.

create policy event_types_select on event_types for select
  using (venue_id in (select auth_venue_ids()));
create policy event_types_write on event_types for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

create policy lost_reasons_select on lost_reasons for select
  using (venue_id in (select auth_venue_ids()));
create policy lost_reasons_write on lost_reasons for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

-- venue_counters has no client-facing policy at all: it is only ever
-- touched via the SECURITY DEFINER next_enquiry_reference() function.

create policy enquiries_select on enquiries for select
  using (venue_id in (select auth_venue_ids()));
create policy enquiries_insert on enquiries for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
create policy enquiries_update on enquiries for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

create policy enquiry_status_history_select on enquiry_status_history for select
  using (venue_id in (select auth_venue_ids()));
-- No direct insert policy: history rows are written only via the
-- SECURITY DEFINER update_enquiry_status() function above, which
-- re-implements the same venue/role check the enquiries write policies use.

create policy activities_select on activities for select
  using (venue_id in (select auth_venue_ids()));
create policy activities_insert on activities for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

create policy tasks_select on tasks for select
  using (venue_id in (select auth_venue_ids()));
create policy tasks_write on tasks for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

-- audit_log: no client insert policy at all (written only by the definer
-- trigger); readable by admin/manager only.
create policy audit_log_select on audit_log for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));
