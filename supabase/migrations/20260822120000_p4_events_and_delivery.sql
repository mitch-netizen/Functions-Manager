-- Phase 4: events (created on confirmation), the pivotal confirm_enquiry()
-- transaction, run sheet delivery, and the FK completions on
-- activities/tasks/files that were deferred until `events` existed.

create table events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  enquiry_id uuid not null,
  final_headcount int,
  confirmed_starts_at timestamptz not null,
  confirmed_ends_at timestamptz not null,
  bump_in_at timestamptz,
  bump_out_at timestamptz,
  room_setup text,
  av_requirements text,
  special_instructions text,
  run_sheet_notes text,
  actual_headcount int,
  actual_spend numeric(10, 2),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (enquiry_id),
  unique (venue_id, id),
  foreign key (venue_id, enquiry_id) references enquiries (venue_id, id),
  check (confirmed_ends_at > confirmed_starts_at)
);

create trigger events_audit
  after insert or update or delete on events
  for each row execute function audit_row_change();

create table event_spaces (
  event_id uuid not null references events (id) on delete cascade,
  venue_id uuid not null references venues (id),
  space_id uuid not null,
  primary key (event_id, space_id),
  foreign key (venue_id, space_id) references spaces (venue_id, id)
);

create table event_packages (
  event_id uuid not null references events (id) on delete cascade,
  venue_id uuid not null references venues (id),
  package_id uuid not null,
  quantity numeric(10, 2) not null default 1,
  primary key (event_id, package_id),
  foreign key (venue_id, package_id) references packages (venue_id, id)
);

create table event_dietary_requirements (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  event_id uuid not null references events (id) on delete cascade,
  requirement text not null,
  headcount int not null default 1
);

-- ---------------------------------------------------------------------------
-- FK completions deferred from Phase 1/3: activities, tasks and files can
-- now attach to an event instead of (or, for files, instead of anything —
-- a venue-level document like T&Cs has neither) an enquiry.
-- ---------------------------------------------------------------------------

alter table activities alter column enquiry_id drop not null;
alter table activities add column event_id uuid;
alter table activities add constraint fk_activities_event
  foreign key (venue_id, event_id) references events (venue_id, id) on delete cascade;
alter table activities add constraint activities_enquiry_or_event
  check (enquiry_id is not null or event_id is not null);

alter table tasks alter column enquiry_id drop not null;
alter table tasks add column event_id uuid;
alter table tasks add constraint fk_tasks_event
  foreign key (venue_id, event_id) references events (venue_id, id) on delete cascade;
alter table tasks add constraint tasks_enquiry_or_event
  check (enquiry_id is not null or event_id is not null);

-- files: relaxed further than activities/tasks — a venue-level document
-- (the T&Cs upload below) belongs to neither an enquiry nor an event, so
-- the check only prevents attaching to *both* rather than requiring one.
alter table files alter column enquiry_id drop not null;
alter table files add column event_id uuid;
alter table files add constraint fk_files_event
  foreign key (venue_id, event_id) references events (venue_id, id) on delete cascade;
alter table files add constraint files_not_both_enquiry_and_event
  check (enquiry_id is null or event_id is null);

alter type file_type add value 'terms_and_conditions';

alter table venue_settings add column terms_and_conditions_file_id uuid;
alter table venue_settings add constraint fk_venue_settings_tc_file
  foreign key (venue_id, terms_and_conditions_file_id) references files (venue_id, id);

-- ---------------------------------------------------------------------------
-- The pivotal confirmation transaction (brief 6.4): converts any existing
-- tentative hold per selected space into a confirmed one (or creates a
-- fresh confirmed hold if none existed), creates the event row, and moves
-- the enquiry to 'confirmed' — all in one function invocation, so a
-- conflict on any space rolls back the whole thing rather than leaving
-- some spaces confirmed and others not.
--
-- The friendly pre-check below (naming the conflicting event) is a UX
-- nicety; the actual correctness guarantee under concurrent confirmations
-- is still the no_overlapping_confirmed_holds exclusion constraint itself,
-- which would abort this same transaction with 23P01 regardless.
-- ---------------------------------------------------------------------------

create or replace function confirm_enquiry(
  p_enquiry_id uuid,
  p_confirmed_starts_at timestamptz,
  p_confirmed_ends_at timestamptz,
  p_space_ids uuid[],
  p_final_headcount int default null
)
returns events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id uuid;
  v_event events;
  v_space_id uuid;
  v_conflict_enquiry_id uuid;
  v_conflict_contact_name text;
  v_conflict_reference text;
begin
  select venue_id into v_venue_id from enquiries where id = p_enquiry_id;
  if v_venue_id is null then
    raise exception 'enquiry % not found', p_enquiry_id;
  end if;

  if v_venue_id not in (select auth_venue_ids())
     or auth_venue_role(v_venue_id) not in ('admin', 'manager', 'coordinator') then
    raise exception 'not authorized to confirm enquiry %', p_enquiry_id;
  end if;

  if p_space_ids is null or array_length(p_space_ids, 1) is null then
    raise exception 'at least one space must be selected to confirm an enquiry';
  end if;

  if p_confirmed_ends_at <= p_confirmed_starts_at then
    raise exception 'confirmed end time must be after the start time';
  end if;

  foreach v_space_id in array p_space_ids loop
    select h.enquiry_id into v_conflict_enquiry_id
    from holds h
    where h.space_id = v_space_id
      and h.hold_type = 'confirmed'
      and h.released_at is null
      and h.enquiry_id <> p_enquiry_id
      and tstzrange(h.starts_at, h.ends_at) && tstzrange(p_confirmed_starts_at, p_confirmed_ends_at)
    limit 1;

    if found then
      select eq.contact_name, eq.reference_number into v_conflict_contact_name, v_conflict_reference
      from enquiries eq where eq.id = v_conflict_enquiry_id;

      raise exception 'conflicts with the confirmed event for % (%)', v_conflict_contact_name, v_conflict_reference;
    end if;
  end loop;

  foreach v_space_id in array p_space_ids loop
    update holds
    set hold_type = 'confirmed', expires_at = null, starts_at = p_confirmed_starts_at, ends_at = p_confirmed_ends_at
    where enquiry_id = p_enquiry_id and space_id = v_space_id and released_at is null and hold_type = 'tentative';

    if not found then
      insert into holds (venue_id, space_id, enquiry_id, starts_at, ends_at, hold_type)
      values (v_venue_id, v_space_id, p_enquiry_id, p_confirmed_starts_at, p_confirmed_ends_at, 'confirmed');
    end if;
  end loop;

  insert into events (venue_id, enquiry_id, final_headcount, confirmed_starts_at, confirmed_ends_at)
  values (v_venue_id, p_enquiry_id, p_final_headcount, p_confirmed_starts_at, p_confirmed_ends_at)
  returning * into v_event;

  insert into event_spaces (event_id, venue_id, space_id)
  select v_event.id, v_venue_id, s from unnest(p_space_ids) as s;

  perform update_enquiry_status(p_enquiry_id, 'confirmed'::enquiry_status);

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: venue-level documents (currently just the T&Cs upload).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('venue-documents', 'venue-documents', false)
on conflict (id) do nothing;

create policy venue_documents_select on storage.objects for select
  using (bucket_id = 'venue-documents' and (storage.foldername(name))[1]::uuid in (select auth_venue_ids()));

create policy venue_documents_write on storage.objects for insert
  with check (
    bucket_id = 'venue-documents'
    and (storage.foldername(name))[1]::uuid in (select auth_venue_ids())
    and auth_venue_role((storage.foldername(name))[1]::uuid) in ('admin', 'manager')
  );

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table events enable row level security;
alter table event_spaces enable row level security;
alter table event_packages enable row level security;
alter table event_dietary_requirements enable row level security;

-- events: standard enquiry-write roles. There is no direct client INSERT
-- policy — events are only ever created via confirm_enquiry() — but UPDATE
-- (operational detail, run sheet notes, completion) is a normal
-- RLS-scoped write.
create policy events_select on events for select
  using (venue_id in (select auth_venue_ids()));
create policy events_update on events for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

create policy event_spaces_select on event_spaces for select
  using (venue_id in (select auth_venue_ids()));
create policy event_spaces_write on event_spaces for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

create policy event_packages_select on event_packages for select
  using (venue_id in (select auth_venue_ids()));
create policy event_packages_write on event_packages for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));

create policy event_dietary_requirements_select on event_dietary_requirements for select
  using (venue_id in (select auth_venue_ids()));
create policy event_dietary_requirements_write on event_dietary_requirements for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
