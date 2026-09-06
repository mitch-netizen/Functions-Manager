-- Every "who did this" foreign key in the schema (enquiries.owner_user_id,
-- enquiries.created_by, activities.actor_user_id, venue_users.user_id,
-- tasks.assignee_user_id, quotes.created_by, files.uploaded_by,
-- accommodation_blocks.created_by, enquiry_status_history.actor_user_id,
-- venue_settings.default_owner_user_id, audit_log.actor_user_id) was
-- defined against auth.users(id) instead of public.profiles(id).
--
-- auth.users is not exposed to PostgREST's API schema at all, so any query
-- embedding profiles(...) through one of these columns (listPipelineEnquiries,
-- getEnquiryTimeline, listVenueUsers, etc.) was structurally unable to
-- resolve the relationship, regardless of what data existed — this
-- surfaced live as PGRST200 ("Could not find a relationship between
-- 'enquiries' and 'profiles'") the first time the Pipeline view was hit
-- against the real production schema.
--
-- public.profiles(id) is a synced 1:1 mirror of auth.users(id) (its own FK
-- is `references auth.users(id) on delete cascade`, populated by the
-- handle_new_or_updated_auth_user trigger), so redirecting these FKs to
-- profiles preserves the same referential guarantee while making the
-- relationship visible to PostgREST. Constraint names are kept identical
-- so no application code (embed hints like
-- `profiles!enquiries_owner_user_id_fkey(...)`) needs to change.

alter table public.accommodation_blocks
  drop constraint accommodation_blocks_created_by_fkey,
  add constraint accommodation_blocks_created_by_fkey
    foreign key (created_by) references public.profiles(id);

alter table public.activities
  drop constraint activities_actor_user_id_fkey,
  add constraint activities_actor_user_id_fkey
    foreign key (actor_user_id) references public.profiles(id);

alter table public.audit_log
  drop constraint audit_log_actor_user_id_fkey,
  add constraint audit_log_actor_user_id_fkey
    foreign key (actor_user_id) references public.profiles(id);

alter table public.enquiries
  drop constraint enquiries_owner_user_id_fkey,
  add constraint enquiries_owner_user_id_fkey
    foreign key (owner_user_id) references public.profiles(id);

alter table public.enquiries
  drop constraint enquiries_created_by_fkey,
  add constraint enquiries_created_by_fkey
    foreign key (created_by) references public.profiles(id);

alter table public.enquiry_status_history
  drop constraint enquiry_status_history_actor_user_id_fkey,
  add constraint enquiry_status_history_actor_user_id_fkey
    foreign key (actor_user_id) references public.profiles(id);

alter table public.files
  drop constraint files_uploaded_by_fkey,
  add constraint files_uploaded_by_fkey
    foreign key (uploaded_by) references public.profiles(id);

alter table public.quotes
  drop constraint quotes_created_by_fkey,
  add constraint quotes_created_by_fkey
    foreign key (created_by) references public.profiles(id);

alter table public.tasks
  drop constraint tasks_assignee_user_id_fkey,
  add constraint tasks_assignee_user_id_fkey
    foreign key (assignee_user_id) references public.profiles(id);

alter table public.venue_settings
  drop constraint venue_settings_default_owner_user_id_fkey,
  add constraint venue_settings_default_owner_user_id_fkey
    foreign key (default_owner_user_id) references public.profiles(id);

alter table public.venue_users
  drop constraint venue_users_user_id_fkey,
  add constraint venue_users_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

notify pgrst, 'reload schema';
