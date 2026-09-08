-- Phase 11: Queens Gladstone domain rebuild, driven by the real setup doc,
-- the live Functions Tracker (built 8 Sep 2026 from the inbox export + the
-- 2026 Event Spreadsheet), the Booking Pack (Sports Lounge / General
-- Function T&Cs), and the Proforma Invoice template. See DECISIONS.md.
--
-- Zero real enquiries/events/quotes/holds exist yet (confirmed before
-- writing this), so this is a clean structural rebuild rather than a
-- data-preserving migration — old columns are dropped outright, not
-- deprecated alongside new ones.
--
-- Depends on p10 (venue_role's renamed labels: functions_manager,
-- duty_manager, executive_readonly, kitchen) having already committed.

-- ---------------------------------------------------------------------------
-- Section 1 — re-point every existing policy/function at the renamed
-- venue_role labels. RENAME VALUE (p10) changes the type's labels but does
-- NOT touch the string literals already compiled into these objects, so
-- every one of them would otherwise start failing to cast 'manager' etc.
-- against a type that no longer has that label.
-- ---------------------------------------------------------------------------

drop policy venues_update on venues;
create policy venues_update on venues for update
  using (id in (select auth_venue_ids()) and auth_venue_role(id) in ('admin', 'functions_manager'))
  with check (id in (select auth_venue_ids()) and auth_venue_role(id) in ('admin', 'functions_manager'));

drop policy venue_settings_update on venue_settings;
create policy venue_settings_update on venue_settings for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy event_types_write on event_types;
create policy event_types_write on event_types for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy lost_reasons_write on lost_reasons;
create policy lost_reasons_write on lost_reasons for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy enquiries_insert on enquiries;
create policy enquiries_insert on enquiries for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy enquiries_update on enquiries;
create policy enquiries_update on enquiries for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy activities_insert on activities;
create policy activities_insert on activities for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy tasks_write on tasks;
create policy tasks_write on tasks for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy audit_log_select on audit_log;
create policy audit_log_select on audit_log for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy spaces_write on spaces;
create policy spaces_write on spaces for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy holds_write on holds;
create policy holds_write on holds for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy quote_pdfs_insert on storage.objects;
create policy quote_pdfs_insert on storage.objects for insert
  with check (
    bucket_id = 'quote-pdfs'
    and (storage.foldername(name))[1]::uuid in (select auth_venue_ids())
    and auth_venue_role((storage.foldername(name))[1]::uuid) in ('admin', 'functions_manager', 'duty_manager')
  );

drop policy packages_write on packages;
create policy packages_write on packages for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy files_insert on files;
create policy files_insert on files for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy files_delete on files;
create policy files_delete on files for delete
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy quotes_insert on quotes;
create policy quotes_insert on quotes for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy quotes_update on quotes;
create policy quotes_update on quotes for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy quotes_delete on quotes;
create policy quotes_delete on quotes for delete
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager') and status = 'draft');

drop policy quote_line_items_write on quote_line_items;
create policy quote_line_items_write on quote_line_items for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy venue_documents_write on storage.objects;
create policy venue_documents_write on storage.objects for insert
  with check (
    bucket_id = 'venue-documents'
    and (storage.foldername(name))[1]::uuid in (select auth_venue_ids())
    and auth_venue_role((storage.foldername(name))[1]::uuid) in ('admin', 'functions_manager')
  );

drop policy events_update on events;
create policy events_update on events for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy event_spaces_write on event_spaces;
create policy event_spaces_write on event_spaces for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy event_packages_write on event_packages;
create policy event_packages_write on event_packages for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy event_dietary_requirements_write on event_dietary_requirements;
create policy event_dietary_requirements_write on event_dietary_requirements for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

drop policy venue_rms_credentials_select on venue_rms_credentials;
create policy venue_rms_credentials_select on venue_rms_credentials for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy venue_rms_credentials_write on venue_rms_credentials;
create policy venue_rms_credentials_write on venue_rms_credentials for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));

drop policy accommodation_blocks_write on accommodation_blocks;
create policy accommodation_blocks_write on accommodation_blocks for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));

-- Functions: CREATE OR REPLACE in place, same signatures, role lists updated.

create or replace function next_enquiry_reference(p_venue_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_venue_id not in (select auth_venue_ids())
     or auth_venue_role(p_venue_id) not in ('admin', 'functions_manager', 'duty_manager') then
    raise exception 'not authorized to allocate a reference number for venue %', p_venue_id;
  end if;

  return allocate_enquiry_reference(p_venue_id);
end;
$$;

-- update_enquiry_status's p_to_status/p_reason_id signature changes below in
-- Section 3 once enquiry_stage exists — redefined there, not here.

-- ---------------------------------------------------------------------------
-- Section 2 — contacts, organisations, booking_types, payments,
-- reply_templates.
-- ---------------------------------------------------------------------------

create table contacts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, id)
);

create trigger contacts_set_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create trigger contacts_audit
  after insert or update or delete on contacts
  for each row execute function audit_row_change();

create table organisations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, id)
);

create trigger organisations_set_updated_at
  before update on organisations
  for each row execute function set_updated_at();

create trigger organisations_audit
  after insert or update or delete on organisations
  for each row execute function audit_row_change();

-- Booking types carry the entire deposit/cancellation/payment ruleset as
-- data (Booking Pack: Sports Lounge Exclusive and General Function have
-- materially different tentative-hold windows, deposit bases, milestone
-- timing and accepted payment methods) — not hardcoded branches in
-- application code, matching every other venue-configurable table in this
-- schema. A future booking type (or a second venue's own types) needs an
-- Admin form fill-in, never a migration.
create type deposit_basis as enum ('percent_of_minimum_spend', 'flat_fee');
create type payment_method as enum ('eftpos', 'direct_deposit', 'cash', 'visa', 'mastercard');

create table booking_types (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null,
  requires_minimum_spend boolean not null default false,
  tentative_hold_days int not null,
  deposit_basis deposit_basis not null,
  deposit_percent numeric(5, 4),
  flat_deposit_amount numeric(10, 2),
  final_numbers_days_before int not null,
  payment_due_days_before int not null,
  cancellation_full_refund_days_before int not null,
  cancellation_nonrefundable_within_days int not null,
  accepted_payment_methods payment_method[] not null default array['eftpos', 'direct_deposit']::payment_method[],
  terms_file_id uuid,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (venue_id, name),
  unique (venue_id, id),
  foreign key (venue_id, terms_file_id) references files (venue_id, id)
);

create trigger booking_types_audit
  after insert or update or delete on booking_types
  for each row execute function audit_row_change();

create type payment_type as enum ('deposit', 'golf', 'balance', 'other');

create table payments (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  enquiry_id uuid not null,
  type payment_type not null,
  amount numeric(10, 2) not null,
  method payment_method not null,
  reference text,
  received_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id),
  notes text,
  created_at timestamptz not null default now(),
  foreign key (venue_id, enquiry_id) references enquiries (venue_id, id)
);

create index payments_enquiry_idx on payments (enquiry_id, received_at);

create trigger payments_audit
  after insert or update or delete on payments
  for each row execute function audit_row_change();

-- Reply Desk drafts: subject/body templates keyed by trigger_key, rendered
-- against an enquiry + venue reference data. `lead_days` is how many days
-- before the relevant deadline (e.g. a booking_type's
-- final_numbers_days_before) the automation rule should surface this draft
-- — Mitch's own example: 16 days prior as a 2-day-lead nudge toward a T-14
-- deadline. The automation rules themselves are application code
-- (lib/automation/rules.ts), not stored procedures — this table is just
-- the venue-editable copy they render.
create table reply_templates (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  trigger_key text not null,
  label text not null,
  kind text not null default 'email' check (kind in ('email', 'call')),
  subject_template text,
  body_template text not null,
  lead_days int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, trigger_key)
);

create trigger reply_templates_set_updated_at
  before update on reply_templates
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Section 3 — enquiries rebuild: contact/organisation FKs replace flat text,
-- the pipeline stage vocabulary is replaced with the real one (from the
-- live tracker's "How To Use" tab), and the full set of booking-lifecycle
-- fields (milestones, golf, bar, compliance, cancellation) are added.
-- ---------------------------------------------------------------------------

create type enquiry_stage as enum (
  'new_enquiry', 'active_enquiry', 'on_hold', 'stale', 'blocked', 'verbal_confirmation',
  'confirmed', 'deposit_paid', 'paid_in_full', 'completed', 'cancelled', 'lost'
);

create type golf_payment_status as enum ('not_required', 'invoiced', 'paid');
create type bar_arrangement as enum ('tab', 'guests_pay_own', 'mixed');

-- enquiry_status_history's terminal-reason check and FK depend on the old
-- enquiry_status type — drop and rebuild alongside enquiries.status itself,
-- since both are empty tables right now.
drop table enquiry_status_history;
drop index if exists enquiries_venue_status_idx;

-- update_enquiry_status(uuid, enquiry_stage, uuid) below is a new overload
-- (different 2nd param type), not a replacement of this one — the old
-- signature must be dropped explicitly or it keeps enquiry_status alive.
drop function update_enquiry_status(uuid, enquiry_status, uuid);

alter table enquiries drop column status;
drop type enquiry_status;

alter table enquiries
  drop column contact_name,
  drop column contact_email,
  drop column contact_phone,
  drop column organisation,
  drop column headcount_estimate,
  drop column alternate_dates,
  drop column date_flexible;

alter table enquiries
  add column contact_id uuid,
  add column organisation_id uuid,
  add column booking_type_id uuid,
  add column event_name text,
  add column pax_min int,
  add column pax_max int,
  add column access_time time,
  add column start_time time,
  add column end_time time,
  add column bump_out_deadline time,
  add column minors_attending boolean,
  add column minors_count int,
  add column minors_notes text,
  add column stage enquiry_stage not null default 'new_enquiry',
  add column on_hold_release_date date,
  add column verbal_confirmation_at timestamptz,
  add column booking_form_signed_at timestamptz,
  add column booking_form_file_id uuid,
  add column deposit_amount_due numeric(10, 2),
  add column deposit_received_at timestamptz,
  add column deposit_reference text,
  add column card_on_file boolean not null default false,
  add column final_numbers_confirmed_at timestamptz,
  add column final_pax int,
  add column catering_ordered_at timestamptz,
  add column payment_due_at timestamptz,
  add column payment_received_at timestamptz,
  add column external_catering_approved boolean,
  add column decorations_notes text,
  add column candles_approved boolean,
  add column golf_bays_booked int not null default 0 check (golf_bays_booked between 0 and 2),
  add column golf_start time,
  add column golf_end time,
  add column golf_rate_per_bay_hour numeric(10, 2),
  add column golf_payment_status golf_payment_status not null default 'not_required',
  add column golf_paid_at timestamptz,
  add column golf_external_reference text,
  add column bar_arrangement bar_arrangement,
  add column bar_tab_limit numeric(10, 2),
  add column bar_tab_prepaid boolean,
  add column cancellation_reason text,
  add column cancellation_approved_by uuid references auth.users (id),
  add column cancellation_approved_reason text;

-- Table is empty in this rebuild, so a plain NOT NULL needs no backfill.
alter table enquiries alter column contact_id set not null;

alter table enquiries
  add constraint fk_enquiries_contact foreign key (venue_id, contact_id) references contacts (venue_id, id),
  add constraint fk_enquiries_organisation foreign key (venue_id, organisation_id) references organisations (venue_id, id),
  add constraint fk_enquiries_booking_type foreign key (venue_id, booking_type_id) references booking_types (venue_id, id),
  add constraint fk_enquiries_booking_form_file foreign key (venue_id, booking_form_file_id) references files (venue_id, id),
  add constraint minors_count_requires_flag check (minors_count is null or minors_attending is true);

create index enquiries_venue_stage_idx on enquiries (venue_id, stage);
create index enquiries_venue_contact_idx on enquiries (venue_id, contact_id);

-- Rebuilt append-only status history, against enquiry_stage.
create table enquiry_status_history (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  venue_id uuid not null references venues (id),
  from_stage enquiry_stage,
  to_stage enquiry_stage not null,
  reason_id uuid,
  actor_user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint reason_required_on_terminal check (
    to_stage not in ('lost', 'cancelled') or reason_id is not null
  ),
  foreign key (venue_id, reason_id) references lost_reasons (venue_id, id)
);

create index enquiry_status_history_enquiry_idx on enquiry_status_history (enquiry_id, created_at);

create or replace function update_enquiry_status(
  p_enquiry_id uuid,
  p_to_stage enquiry_stage,
  p_reason_id uuid default null
)
returns enquiries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enquiry enquiries;
  v_from_stage enquiry_stage;
  v_venue_id uuid;
begin
  select stage, venue_id into v_from_stage, v_venue_id from enquiries where id = p_enquiry_id;

  if v_from_stage is null then
    raise exception 'enquiry % not found', p_enquiry_id;
  end if;

  if v_venue_id not in (select auth_venue_ids())
     or auth_venue_role(v_venue_id) not in ('admin', 'functions_manager', 'duty_manager') then
    raise exception 'not authorized to change stage on enquiry %', p_enquiry_id;
  end if;

  if p_to_stage in ('lost', 'cancelled') and p_reason_id is null then
    raise exception 'a reason is required when moving an enquiry to %', p_to_stage;
  end if;

  update enquiries set stage = p_to_stage where id = p_enquiry_id
  returning * into v_enquiry;

  insert into enquiry_status_history (enquiry_id, venue_id, from_stage, to_stage, reason_id, actor_user_id)
  values (p_enquiry_id, v_venue_id, v_from_stage, p_to_stage, p_reason_id, auth.uid());

  return v_enquiry;
end;
$$;

create policy enquiry_status_history_select on enquiry_status_history for select
  using (venue_id in (select auth_venue_ids()));
alter table enquiry_status_history enable row level security;

create policy contacts_select on contacts for select
  using (venue_id in (select auth_venue_ids()));
create policy contacts_write on contacts for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));
alter table contacts enable row level security;

create policy organisations_select on organisations for select
  using (venue_id in (select auth_venue_ids()));
create policy organisations_write on organisations for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));
alter table organisations enable row level security;

create policy booking_types_select on booking_types for select
  using (venue_id in (select auth_venue_ids()));
create policy booking_types_write on booking_types for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));
alter table booking_types enable row level security;

create policy payments_select on payments for select
  using (venue_id in (select auth_venue_ids()));
create policy payments_write on payments for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager', 'duty_manager'));
alter table payments enable row level security;

create policy reply_templates_select on reply_templates for select
  using (venue_id in (select auth_venue_ids()));
create policy reply_templates_write on reply_templates for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'functions_manager'));
alter table reply_templates enable row level security;

-- ---------------------------------------------------------------------------
-- Section 4 — events: Diary 2026's operational checklist fields
-- (confirmed-events-only, distinct from the enquiry-phase milestone fields
-- above).
-- ---------------------------------------------------------------------------

alter table events
  add column run_sheet_generated boolean not null default false,
  add column run_sheet_printed boolean not null default false,
  add column opentable_entered boolean not null default false,
  add column staff_briefed boolean not null default false,
  add column contra_booking boolean not null default false;

-- ---------------------------------------------------------------------------
-- Section 5 — confirm_enquiry: role names + the conflict-message lookup
-- now joins contacts instead of reading the dropped contact_name column.
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
     or auth_venue_role(v_venue_id) not in ('admin', 'functions_manager', 'duty_manager') then
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
      select c.name, eq.reference_number into v_conflict_contact_name, v_conflict_reference
      from enquiries eq join contacts c on c.id = eq.contact_id
      where eq.id = v_conflict_enquiry_id;

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

  perform update_enquiry_status(p_enquiry_id, 'confirmed'::enquiry_stage);

  return v_event;
end;
$$;

-- ---------------------------------------------------------------------------
-- Section 6 — create_public_enquiry: creates a contacts row instead of
-- writing flat text, maps the single public-form headcount into
-- pax_min/pax_max. Same signature as before (app/api/public-enquiry/route.ts
-- is unaffected), so the existing anon grant carries over unchanged.
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
  v_contact_id uuid;
  v_default_owner_id uuid;
  v_followup_days int;
begin
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

  insert into contacts (venue_id, name, email, phone)
  values (v_venue_id, p_contact_name, nullif(p_contact_email, ''), p_contact_phone)
  returning id into v_contact_id;

  insert into enquiries (
    venue_id, reference_number, source, contact_id,
    event_type_id, preferred_date, pax_min, pax_max, brief_description, owner_user_id
  )
  values (
    v_venue_id, v_reference, 'website', v_contact_id,
    p_event_type_id, p_preferred_date, p_headcount_estimate, p_headcount_estimate, p_brief_description, v_default_owner_id
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

-- ---------------------------------------------------------------------------
-- Section 7 — venue_settings: legal/bank/GST/auth-domain/golf-default
-- fields (setup doc §2, §9, Reference tab).
-- ---------------------------------------------------------------------------

alter table venue_settings
  add column abn text,
  add column gst_registered boolean not null default true,
  add column bank_account_name text,
  add column bank_bsb text,
  add column bank_account_number text,
  add column remittance_email text,
  add column functions_inbox_email text,
  add column auth_allowed_email_domain text,
  add column golf_rate_per_bay_hour numeric(10, 2) not null default 150.00,
  add column golf_max_bays int not null default 2,
  add column golf_max_participants_per_bay int not null default 8;

-- ---------------------------------------------------------------------------
-- Section 8 — kitchen: row- and column-restricted read access.
--
-- A plain `security_invoker` view is NOT sufficient here: it re-evaluates
-- the *base* enquiries table's RLS for the caller, and enquiries_select
-- (below) is "any venue member" with no role check — so a security_invoker
-- view would have silently granted kitchen nothing beyond what the
-- unrestricted base policy already gives it, defeating the point.
--
-- Instead: enquiries_select and events_select are tightened to explicitly
-- exclude the kitchen role (same "not in RLS by default" posture as every
-- other role-restricted policy in this schema), and a SECURITY DEFINER
-- function is the one place kitchen gets its narrow catering/golf/timing
-- read — the check is re-implemented explicitly inside it, same pattern as
-- next_enquiry_reference/update_enquiry_status/confirm_enquiry above.
-- ---------------------------------------------------------------------------

drop policy enquiries_select on enquiries;
create policy enquiries_select on enquiries for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

drop policy events_select on events;
create policy events_select on events for select
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) <> 'kitchen');

create or replace function get_kitchen_bookings(p_venue_id uuid)
returns table (
  enquiry_id uuid,
  reference_number text,
  event_name text,
  preferred_date date,
  start_time time,
  end_time time,
  pax_min int,
  pax_max int,
  final_pax int,
  minors_attending boolean,
  golf_bays_booked int,
  golf_start time,
  golf_end time,
  stage enquiry_stage
)
language sql
security definer
stable
set search_path = public
as $$
  select
    e.id, e.reference_number, e.event_name, e.preferred_date, e.start_time, e.end_time,
    e.pax_min, e.pax_max, e.final_pax, e.minors_attending, e.golf_bays_booked, e.golf_start, e.golf_end, e.stage
  from enquiries e
  where e.venue_id = p_venue_id
    and p_venue_id in (select auth_venue_ids())
    and e.stage in ('confirmed', 'deposit_paid', 'paid_in_full', 'completed');
$$;

grant execute on function get_kitchen_bookings(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Section 9 — seed the two real booking types from the Booking Pack T&Cs.
-- Deposit/cancellation figures below are the confirmed policy text; the
-- dollar minimum-spend figure itself is NOT seeded here (Reference tab
-- flags $8,500 vs $10,000 as an open conflict — Admin fills in `spaces`'
-- minimum_spend once that's settled, not invented here).
-- ---------------------------------------------------------------------------

insert into booking_types (
  venue_id, name, requires_minimum_spend, tentative_hold_days, deposit_basis, deposit_percent,
  final_numbers_days_before, payment_due_days_before, cancellation_full_refund_days_before,
  cancellation_nonrefundable_within_days, accepted_payment_methods
)
select
  v.id, 'Sports Lounge Exclusive', true, 14, 'percent_of_minimum_spend', 0.25,
  14, 14, 14, 7, array['eftpos', 'direct_deposit']::payment_method[]
from venues v
on conflict (venue_id, name) do nothing;

insert into booking_types (
  venue_id, name, requires_minimum_spend, tentative_hold_days, deposit_basis,
  final_numbers_days_before, payment_due_days_before, cancellation_full_refund_days_before,
  cancellation_nonrefundable_within_days, accepted_payment_methods
)
select
  v.id, 'General Function', false, 7, 'flat_fee',
  7, 7, 7, 7, array['cash', 'eftpos', 'direct_deposit', 'visa', 'mastercard']::payment_method[]
from venues v
on conflict (venue_id, name) do nothing;
