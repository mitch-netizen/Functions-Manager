-- Phase 3: packages, quotes (versioned, immutable once sent), and the
-- `files` table (pulled forward from its Phase 4 slot in the brief's data
-- model listing — quotes.pdf_file_id needs it now; see DECISIONS.md).

create type package_category as enum ('food', 'beverage', 'room_hire', 'av', 'other');

create table packages (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id) on delete cascade,
  name text not null,
  description text,
  per_head_price numeric(10, 2),
  minimum_numbers int,
  inclusions jsonb not null default '[]'::jsonb, -- structured list, not free text
  category package_category not null,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  unique (venue_id, id)
);

create trigger packages_audit
  after insert or update or delete on packages
  for each row execute function audit_row_change();

create type file_type as enum ('signed_proposal', 'floor_plan', 'client_brief', 'invoice', 'other');

-- event_id is added in the Phase 4 migration once `events` exists (same
-- pattern as activities/tasks in Phase 1) — enquiry_id is required for now.
create table files (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  enquiry_id uuid not null,
  filename text not null,
  storage_path text not null,
  file_type file_type not null,
  uploaded_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (venue_id, id),
  foreign key (venue_id, enquiry_id) references enquiries (venue_id, id)
);

create trigger files_audit
  after insert or update or delete on files
  for each row execute function audit_row_change();

create type quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired', 'superseded');

create table quotes (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  enquiry_id uuid not null,
  version int not null,
  status quote_status not null default 'draft',
  subtotal numeric(10, 2) not null default 0,
  gst_amount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  minimum_spend_applied numeric(10, 2),
  valid_until date,
  pdf_file_id uuid,
  sent_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (enquiry_id, version),
  unique (venue_id, id),
  foreign key (venue_id, enquiry_id) references enquiries (venue_id, id),
  foreign key (venue_id, pdf_file_id) references files (venue_id, id)
);

create trigger quotes_audit
  after insert or update or delete on quotes
  for each row execute function audit_row_change();

create table quote_line_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  quote_id uuid not null references quotes (id) on delete cascade,
  package_id uuid, -- null = ad hoc line
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  display_order int not null default 0,
  foreign key (venue_id, package_id) references packages (venue_id, id)
);

create index quote_line_items_quote_idx on quote_line_items (quote_id, display_order);

-- Immutability: once a quote leaves 'draft', its financial fields, enquiry
-- link, and version can never change again (edits after send always create
-- a new version instead — see lib/domain/quotes/actions.ts). Status
-- transitions (draft -> sent -> accepted/declined/expired, or -> superseded)
-- and setting pdf_file_id/sent_at remain allowed, since sendQuote() sets
-- all three in one UPDATE while the row is still 'draft' from the
-- trigger's point of view (OLD.status), so this never actually fires for
-- that transition — only for a later attempt to edit a non-draft quote.
create or replace function enforce_quote_immutability()
returns trigger
language plpgsql
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

create trigger quotes_immutability
  before update or delete on quotes
  for each row execute function enforce_quote_immutability();

-- Line items follow their parent quote's status, whichever RLS-scoped
-- client tries to touch them (not just the app's own code paths).
create or replace function enforce_quote_line_items_immutability()
returns trigger
language plpgsql
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

create trigger quote_line_items_immutability
  before insert or update or delete on quote_line_items
  for each row execute function enforce_quote_line_items_immutability();

-- Storage: the quote PDF bucket. Path convention {venue_id}/{enquiry_id}/{uuid}-{filename}.
insert into storage.buckets (id, name, public)
values ('quote-pdfs', 'quote-pdfs', false)
on conflict (id) do nothing;

create policy quote_pdfs_select on storage.objects for select
  using (bucket_id = 'quote-pdfs' and (storage.foldername(name))[1]::uuid in (select auth_venue_ids()));

create policy quote_pdfs_insert on storage.objects for insert
  with check (
    bucket_id = 'quote-pdfs'
    and (storage.foldername(name))[1]::uuid in (select auth_venue_ids())
    and auth_venue_role((storage.foldername(name))[1]::uuid) in ('admin', 'manager', 'coordinator')
  );

alter table packages enable row level security;
alter table files enable row level security;
alter table quotes enable row level security;
alter table quote_line_items enable row level security;

-- packages: same admin/manager-write pattern as spaces/event_types/lost_reasons —
-- "coordinator cannot alter packages/pricing" per the brief.
create policy packages_select on packages for select
  using (venue_id in (select auth_venue_ids()));
create policy packages_write on packages for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

-- files: attachable by anyone who can work the enquiry; deletion reserved
-- for admin/manager (avoid a coordinator removing evidence like a signed
-- proposal or an uploaded invoice).
create policy files_select on files for select
  using (venue_id in (select auth_venue_ids()));
create policy files_insert on files for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
create policy files_delete on files for delete
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager'));

-- quotes: standard enquiry-write roles. UPDATE is deliberately NOT
-- restricted to status='draft' here — legitimate status-only transitions
-- on a non-draft quote must still be possible (sent -> accepted/declined/
-- expired/superseded, e.g. when reviseQuote() supersedes the previous
-- version). RLS only sees OLD vs a role/venue check, not OLD-vs-NEW field
-- diffs, so the "financial fields are frozen once sent" invariant is the
-- enforce_quote_immutability trigger's job alone, not duplicated here.
-- DELETE keeps the draft-only restriction, since deleting a non-draft quote
-- is never legitimate (the trigger also independently rejects it).
create policy quotes_select on quotes for select
  using (venue_id in (select auth_venue_ids()));
create policy quotes_insert on quotes for insert
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
create policy quotes_update on quotes for update
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
create policy quotes_delete on quotes for delete
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator') and status = 'draft');

-- quote_line_items: relies on the enforce_quote_line_items_immutability
-- trigger (not a duplicated subquery here) to block writes once the parent
-- quote isn't draft — one source of truth for that specific invariant.
create policy quote_line_items_select on quote_line_items for select
  using (venue_id in (select auth_venue_ids()));
create policy quote_line_items_write on quote_line_items for all
  using (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'))
  with check (venue_id in (select auth_venue_ids()) and auth_venue_role(venue_id) in ('admin', 'manager', 'coordinator'));
