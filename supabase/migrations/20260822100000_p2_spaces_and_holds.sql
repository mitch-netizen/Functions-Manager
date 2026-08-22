-- Phase 2: bookable spaces and holds (tentative/confirmed), with a DB-level
-- guarantee that two confirmed holds can never overlap on the same space.

-- Composite-FK anchor for enquiries, added here rather than in the Phase 1
-- migration (already applied/committed) — id is already globally unique via
-- the primary key, so this is trivially satisfiable and just lets later
-- tables enforce "same venue" alongside "this row exists".
alter table enquiries add constraint enquiries_venue_id_id_key unique (venue_id, id);

create table spaces (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null,
  capacity_seated int,
  capacity_standing int,
  capacity_cocktail int,
  minimum_spend numeric(10, 2),
  notes text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (venue_id, name),
  unique (venue_id, id)
);

create trigger spaces_audit
  after insert or update or delete on spaces
  for each row execute function audit_row_change();

alter table enquiries add column space_preference_id uuid;
alter table enquiries add constraint fk_enquiries_space_preference
  foreign key (venue_id, space_preference_id) references spaces (venue_id, id);

create type hold_type as enum ('tentative', 'confirmed');

create table holds (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  space_id uuid not null,
  enquiry_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hold_type hold_type not null,
  expires_at timestamptz, -- set for tentative holds, null for confirmed
  released_at timestamptz, -- non-null once expired/manually released
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (hold_type = 'tentative' or expires_at is null),
  foreign key (venue_id, space_id) references spaces (venue_id, id),
  foreign key (venue_id, enquiry_id) references enquiries (venue_id, id)
);

create index holds_active_space_range_idx on holds (venue_id, space_id, starts_at, ends_at)
  where released_at is null;

-- The actual conflict-prevention mechanism: two active confirmed holds on
-- the same space can never have overlapping [starts_at, ends_at) ranges.
-- Tentative holds are deliberately excluded from this constraint — they
-- warn (via an app-level availability check), they do not block.
create extension if not exists btree_gist with schema extensions;

alter table holds add constraint no_overlapping_confirmed_holds
  exclude using gist (
    space_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (hold_type = 'confirmed' and released_at is null);

alter table spaces enable row level security;
alter table holds enable row level security;

-- spaces: same admin/manager-write pattern as packages/event_types/lost_reasons.
create policy spaces_select on spaces for select
  using (venue_id in (select auth_venue_ids()));
create policy spaces_write on spaces for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

-- holds: same admin/manager/coordinator-write pattern as enquiries — placing
-- and releasing a hold is an operational action per the brief (6.2).
create policy holds_select on holds for select
  using (venue_id in (select auth_venue_ids()));
create policy holds_write on holds for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
