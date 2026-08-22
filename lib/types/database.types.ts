// PLACEHOLDER — this file is normally generated, never hand-written (see
// DECISIONS.md). It exists only so the app type-checks before a live
// Supabase project exists: provisioning is currently blocked on an overdue
// invoice on the "FlowLab Solutions" organization.
//
// Once a project exists and supabase/migrations/20260822090000_p1_core_and_enquiries.sql
// has been applied, regenerate this file with
// `mcp__Supabase__generate_typescript_types` (or `supabase gen types
// typescript --linked`) and replace it wholesale. Do not hand-edit after that.
//
// Every table below carries `Relationships: []` even where a foreign key
// exists (e.g. enquiries.event_type_id -> event_types.id): supabase-js's
// GenericTable type requires the field to be present at all just to
// satisfy its structural constraint (its absence silently degrades every
// query's inferred row type to `never`), but real relationship metadata is
// only ever produced by the generator itself — hand-authoring it would be
// guessing at a shape this file already disclaims. Call sites that embed a
// related row (e.g. `.select("...", event_types(name))`) type it
// explicitly via `.returns<T>()` instead of relying on inference here.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VenueRole = "admin" | "manager" | "coordinator" | "viewer";
export type EnquirySource = "phone" | "email" | "walk_in" | "website" | "social" | "referral" | "repeat";
export type EnquiryStatus =
  | "new"
  | "qualifying"
  | "proposal_sent"
  | "tentative"
  | "confirmed"
  | "completed"
  | "lost"
  | "cancelled";
export type ActivityType =
  | "note"
  | "email_sent"
  | "email_received"
  | "call"
  | "meeting"
  | "site_visit"
  | "status_change"
  | "file_upload";

type Tables = Database["public"]["Tables"];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: never; // written only via the handle_new_or_updated_auth_user() trigger
        Update: never;
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          name: string;
          trading_name: string | null;
          slug: string;
          address: string | null;
          abn: string | null;
          timezone: string;
          brand_config: Json;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Tables["venues"]["Row"]> & { name: string; slug: string };
        Update: Partial<Tables["venues"]["Row"]>;
        Relationships: [];
      };
      venue_settings: {
        Row: {
          venue_id: string;
          legal_entity_name: string | null;
          gst_rate: number;
          default_tentative_hold_days: number;
          default_followup_new_enquiry_business_days: number;
          default_followup_proposal_sent_business_days: number;
          stale_enquiry_days: number;
          hold_expiry_warning_days: number;
          final_details_days_before_event: number;
          final_numbers_days_before_event: number;
          default_owner_user_id: string | null;
          privacy_notice_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Tables["venue_settings"]["Row"]> & { venue_id: string };
        Update: Partial<Tables["venue_settings"]["Row"]>;
        Relationships: [];
      };
      venue_users: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          role: VenueRole;
          created_at: string;
        };
        Insert: Partial<Tables["venue_users"]["Row"]> & {
          user_id: string;
          venue_id: string;
          role: VenueRole;
        };
        Update: Partial<Tables["venue_users"]["Row"]>;
        Relationships: [];
      };
      event_types: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<Tables["event_types"]["Row"]> & { venue_id: string; name: string };
        Update: Partial<Tables["event_types"]["Row"]>;
        Relationships: [];
      };
      lost_reasons: {
        Row: {
          id: string;
          venue_id: string;
          label: string;
          active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<Tables["lost_reasons"]["Row"]> & { venue_id: string; label: string };
        Update: Partial<Tables["lost_reasons"]["Row"]>;
        Relationships: [];
      };
      enquiries: {
        Row: {
          id: string;
          venue_id: string;
          reference_number: string;
          source: EnquirySource;
          contact_name: string;
          contact_email: string | null;
          contact_phone: string;
          organisation: string | null;
          event_type_id: string | null;
          preferred_date: string | null;
          date_flexible: boolean;
          alternate_dates: string[] | null;
          headcount_estimate: number | null;
          budget_indication: number | null;
          brief_description: string | null;
          status: EnquiryStatus;
          owner_user_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Tables["enquiries"]["Row"]> & {
          venue_id: string;
          reference_number: string;
          source: EnquirySource;
          contact_name: string;
          contact_phone: string;
        };
        Update: Partial<Tables["enquiries"]["Row"]>;
        Relationships: [];
      };
      enquiry_status_history: {
        Row: {
          id: string;
          enquiry_id: string;
          venue_id: string;
          from_status: EnquiryStatus | null;
          to_status: EnquiryStatus;
          reason_id: string | null;
          actor_user_id: string | null;
          created_at: string;
        };
        Insert: never; // written only via update_enquiry_status()
        Update: never;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          venue_id: string;
          enquiry_id: string;
          type: ActivityType;
          body: string | null;
          actor_user_id: string | null;
          created_at: string;
        };
        Insert: Partial<Tables["activities"]["Row"]> & {
          venue_id: string;
          enquiry_id: string;
          type: ActivityType;
        };
        Update: Partial<Tables["activities"]["Row"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          venue_id: string;
          enquiry_id: string;
          title: string;
          due_date: string;
          assignee_user_id: string | null;
          completed: boolean;
          completed_at: string | null;
          source: string;
          created_at: string;
        };
        Insert: Partial<Tables["tasks"]["Row"]> & {
          venue_id: string;
          enquiry_id: string;
          title: string;
          due_date: string;
        };
        Update: Partial<Tables["tasks"]["Row"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          venue_id: string;
          table_name: string;
          record_id: string;
          action: "insert" | "update" | "delete";
          actor_user_id: string | null;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
        Insert: never; // written only via the audit_row_change() trigger
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_enquiry_reference: {
        Args: { p_venue_id: string };
        Returns: string;
      };
      update_enquiry_status: {
        Args: { p_enquiry_id: string; p_to_status: EnquiryStatus; p_reason_id?: string | null };
        Returns: Tables["enquiries"]["Row"];
      };
    };
  };
}
