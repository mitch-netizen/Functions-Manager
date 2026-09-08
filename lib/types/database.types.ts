// Generated from the live "The Queens" Supabase project
// (zbzoymnunjwwgwgklaui, ap-southeast-2) via
// `mcp__Supabase__generate_typescript_types` after applying
// 20260908160000_p10_venue_role_rename.sql and
// 20260908160500_p11_queens_domain_rebuild.sql. Never hand-edited beyond
// the two narrow, documented deviations below — regenerate wholesale
// after any future migration and reapply both:
//
// 1. Two RPC Args blocks (create_public_enquiry, below and
//    record_public_accommodation_booking) have several params widened to
//    `| null` by hand. The generator (PostgREST 14.5) omits `| null` from
//    any function arg without a SQL-level default, even when the function
//    body treats it as optional — Postgres function parameters are always
//    callable with NULL regardless of declared type. Each widened block
//    carries its own comment explaining exactly which params and why.
// 2. The convenience Enum aliases at the very end of this file (VenueRole,
//    HoldType, etc.) are not part of the generator's output — kept so call
//    sites written against the earlier hand-written placeholder didn't
//    need to change import shape when this file was replaced with real
//    generated types.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accommodation_blocks: {
        Row: {
          check_in_window_end: string
          check_in_window_start: string
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          nights_allowed: number
          public_token: string
          rms_room_type_code: string
          rooms_held: number
          status: Database["public"]["Enums"]["accommodation_block_status"]
          venue_id: string
        }
        Insert: {
          check_in_window_end: string
          check_in_window_start: string
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          nights_allowed?: number
          public_token?: string
          rms_room_type_code: string
          rooms_held: number
          status?: Database["public"]["Enums"]["accommodation_block_status"]
          venue_id: string
        }
        Update: {
          check_in_window_end?: string
          check_in_window_start?: string
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          nights_allowed?: number
          public_token?: string
          rms_room_type_code?: string
          rooms_held?: number
          status?: Database["public"]["Enums"]["accommodation_block_status"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_blocks_venue_id_event_id_fkey"
            columns: ["venue_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "accommodation_blocks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_bookings: {
        Row: {
          block_id: string
          check_in: string
          check_out: string
          created_at: string
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          rms_booking_reference: string
          room_type_code: string
          status: Database["public"]["Enums"]["accommodation_booking_status"]
          venue_id: string
        }
        Insert: {
          block_id: string
          check_in: string
          check_out: string
          created_at?: string
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          rms_booking_reference: string
          room_type_code: string
          status?: Database["public"]["Enums"]["accommodation_booking_status"]
          venue_id: string
        }
        Update: {
          block_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          rms_booking_reference?: string
          room_type_code?: string
          status?: Database["public"]["Enums"]["accommodation_booking_status"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_bookings_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "accommodation_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          actor_user_id: string | null
          body: string | null
          created_at: string
          enquiry_id: string | null
          event_id: string | null
          id: string
          type: Database["public"]["Enums"]["activity_type"]
          venue_id: string
        }
        Insert: {
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          enquiry_id?: string | null
          event_id?: string | null
          id?: string
          type: Database["public"]["Enums"]["activity_type"]
          venue_id: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          enquiry_id?: string | null
          event_id?: string | null
          id?: string
          type?: Database["public"]["Enums"]["activity_type"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_event"
            columns: ["venue_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          record_id: string
          table_name: string
          venue_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          record_id: string
          table_name: string
          venue_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          record_id?: string
          table_name?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_job_runs: {
        Row: {
          fired_at: string
          id: string
          occurrence_key: string
          rule_key: string
          subject_id: string
          subject_table: string
        }
        Insert: {
          fired_at?: string
          id?: string
          occurrence_key?: string
          rule_key: string
          subject_id: string
          subject_table: string
        }
        Update: {
          fired_at?: string
          id?: string
          occurrence_key?: string
          rule_key?: string
          subject_id?: string
          subject_table?: string
        }
        Relationships: []
      }
      booking_types: {
        Row: {
          accepted_payment_methods: Database["public"]["Enums"]["payment_method"][]
          active: boolean
          cancellation_full_refund_days_before: number
          cancellation_nonrefundable_within_days: number
          created_at: string
          deposit_basis: Database["public"]["Enums"]["deposit_basis"]
          deposit_percent: number | null
          display_order: number
          final_numbers_days_before: number
          flat_deposit_amount: number | null
          id: string
          name: string
          payment_due_days_before: number
          requires_minimum_spend: boolean
          tentative_hold_days: number
          terms_file_id: string | null
          venue_id: string
        }
        Insert: {
          accepted_payment_methods?: Database["public"]["Enums"]["payment_method"][]
          active?: boolean
          cancellation_full_refund_days_before: number
          cancellation_nonrefundable_within_days: number
          created_at?: string
          deposit_basis: Database["public"]["Enums"]["deposit_basis"]
          deposit_percent?: number | null
          display_order?: number
          final_numbers_days_before: number
          flat_deposit_amount?: number | null
          id?: string
          name: string
          payment_due_days_before: number
          requires_minimum_spend?: boolean
          tentative_hold_days: number
          terms_file_id?: string | null
          venue_id: string
        }
        Update: {
          accepted_payment_methods?: Database["public"]["Enums"]["payment_method"][]
          active?: boolean
          cancellation_full_refund_days_before?: number
          cancellation_nonrefundable_within_days?: number
          created_at?: string
          deposit_basis?: Database["public"]["Enums"]["deposit_basis"]
          deposit_percent?: number | null
          display_order?: number
          final_numbers_days_before?: number
          flat_deposit_amount?: number | null
          id?: string
          name?: string
          payment_due_days_before?: number
          requires_minimum_spend?: boolean
          tentative_hold_days?: number
          terms_file_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_types_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_types_venue_id_terms_file_id_fkey"
            columns: ["venue_id", "terms_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          access_time: string | null
          bar_arrangement: Database["public"]["Enums"]["bar_arrangement"] | null
          bar_tab_limit: number | null
          bar_tab_prepaid: boolean | null
          booking_form_file_id: string | null
          booking_form_signed_at: string | null
          booking_type_id: string | null
          brief_description: string | null
          budget_indication: number | null
          bump_out_deadline: string | null
          cancellation_approved_by: string | null
          cancellation_approved_reason: string | null
          cancellation_reason: string | null
          candles_approved: boolean | null
          card_on_file: boolean
          catering_ordered_at: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          decorations_notes: string | null
          deposit_amount_due: number | null
          deposit_received_at: string | null
          deposit_reference: string | null
          end_time: string | null
          event_name: string | null
          event_type_id: string | null
          external_catering_approved: boolean | null
          final_numbers_confirmed_at: string | null
          final_pax: number | null
          golf_bays_booked: number
          golf_end: string | null
          golf_external_reference: string | null
          golf_paid_at: string | null
          golf_payment_status: Database["public"]["Enums"]["golf_payment_status"]
          golf_rate_per_bay_hour: number | null
          golf_start: string | null
          id: string
          minors_attending: boolean | null
          minors_count: number | null
          minors_notes: string | null
          on_hold_release_date: string | null
          organisation_id: string | null
          owner_user_id: string | null
          pax_max: number | null
          pax_min: number | null
          payment_due_at: string | null
          payment_received_at: string | null
          preferred_date: string | null
          reference_number: string
          source: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id: string | null
          stage: Database["public"]["Enums"]["enquiry_stage"]
          start_time: string | null
          updated_at: string
          venue_id: string
          verbal_confirmation_at: string | null
        }
        Insert: {
          access_time?: string | null
          bar_arrangement?:
            | Database["public"]["Enums"]["bar_arrangement"]
            | null
          bar_tab_limit?: number | null
          bar_tab_prepaid?: boolean | null
          booking_form_file_id?: string | null
          booking_form_signed_at?: string | null
          booking_type_id?: string | null
          brief_description?: string | null
          budget_indication?: number | null
          bump_out_deadline?: string | null
          cancellation_approved_by?: string | null
          cancellation_approved_reason?: string | null
          cancellation_reason?: string | null
          candles_approved?: boolean | null
          card_on_file?: boolean
          catering_ordered_at?: string | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          decorations_notes?: string | null
          deposit_amount_due?: number | null
          deposit_received_at?: string | null
          deposit_reference?: string | null
          end_time?: string | null
          event_name?: string | null
          event_type_id?: string | null
          external_catering_approved?: boolean | null
          final_numbers_confirmed_at?: string | null
          final_pax?: number | null
          golf_bays_booked?: number
          golf_end?: string | null
          golf_external_reference?: string | null
          golf_paid_at?: string | null
          golf_payment_status?: Database["public"]["Enums"]["golf_payment_status"]
          golf_rate_per_bay_hour?: number | null
          golf_start?: string | null
          id?: string
          minors_attending?: boolean | null
          minors_count?: number | null
          minors_notes?: string | null
          on_hold_release_date?: string | null
          organisation_id?: string | null
          owner_user_id?: string | null
          pax_max?: number | null
          pax_min?: number | null
          payment_due_at?: string | null
          payment_received_at?: string | null
          preferred_date?: string | null
          reference_number: string
          source: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id?: string | null
          stage?: Database["public"]["Enums"]["enquiry_stage"]
          start_time?: string | null
          updated_at?: string
          venue_id: string
          verbal_confirmation_at?: string | null
        }
        Update: {
          access_time?: string | null
          bar_arrangement?:
            | Database["public"]["Enums"]["bar_arrangement"]
            | null
          bar_tab_limit?: number | null
          bar_tab_prepaid?: boolean | null
          booking_form_file_id?: string | null
          booking_form_signed_at?: string | null
          booking_type_id?: string | null
          brief_description?: string | null
          budget_indication?: number | null
          bump_out_deadline?: string | null
          cancellation_approved_by?: string | null
          cancellation_approved_reason?: string | null
          cancellation_reason?: string | null
          candles_approved?: boolean | null
          card_on_file?: boolean
          catering_ordered_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          decorations_notes?: string | null
          deposit_amount_due?: number | null
          deposit_received_at?: string | null
          deposit_reference?: string | null
          end_time?: string | null
          event_name?: string | null
          event_type_id?: string | null
          external_catering_approved?: boolean | null
          final_numbers_confirmed_at?: string | null
          final_pax?: number | null
          golf_bays_booked?: number
          golf_end?: string | null
          golf_external_reference?: string | null
          golf_paid_at?: string | null
          golf_payment_status?: Database["public"]["Enums"]["golf_payment_status"]
          golf_rate_per_bay_hour?: number | null
          golf_start?: string | null
          id?: string
          minors_attending?: boolean | null
          minors_count?: number | null
          minors_notes?: string | null
          on_hold_release_date?: string | null
          organisation_id?: string | null
          owner_user_id?: string | null
          pax_max?: number | null
          pax_min?: number | null
          payment_due_at?: string | null
          payment_received_at?: string | null
          preferred_date?: string | null
          reference_number?: string
          source?: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id?: string | null
          stage?: Database["public"]["Enums"]["enquiry_stage"]
          start_time?: string | null
          updated_at?: string
          venue_id?: string
          verbal_confirmation_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_venue_id_event_type_id_fkey"
            columns: ["venue_id", "event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "enquiries_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enquiries_booking_form_file"
            columns: ["venue_id", "booking_form_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "fk_enquiries_booking_type"
            columns: ["venue_id", "booking_type_id"]
            isOneToOne: false
            referencedRelation: "booking_types"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "fk_enquiries_contact"
            columns: ["venue_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "fk_enquiries_organisation"
            columns: ["venue_id", "organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "fk_enquiries_space_preference"
            columns: ["venue_id", "space_preference_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      enquiry_status_history: {
        Row: {
          actor_user_id: string | null
          created_at: string
          enquiry_id: string
          from_stage: Database["public"]["Enums"]["enquiry_stage"] | null
          id: string
          reason_id: string | null
          to_stage: Database["public"]["Enums"]["enquiry_stage"]
          venue_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          enquiry_id: string
          from_stage?: Database["public"]["Enums"]["enquiry_stage"] | null
          id?: string
          reason_id?: string | null
          to_stage: Database["public"]["Enums"]["enquiry_stage"]
          venue_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          enquiry_id?: string
          from_stage?: Database["public"]["Enums"]["enquiry_stage"] | null
          id?: string
          reason_id?: string | null
          to_stage?: Database["public"]["Enums"]["enquiry_stage"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_status_history_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiry_status_history_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiry_status_history_venue_id_reason_id_fkey"
            columns: ["venue_id", "reason_id"]
            isOneToOne: false
            referencedRelation: "lost_reasons"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      event_dietary_requirements: {
        Row: {
          event_id: string
          headcount: number
          id: string
          requirement: string
          venue_id: string
        }
        Insert: {
          event_id: string
          headcount?: number
          id?: string
          requirement: string
          venue_id: string
        }
        Update: {
          event_id?: string
          headcount?: number
          id?: string
          requirement?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_dietary_requirements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dietary_requirements_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      event_packages: {
        Row: {
          event_id: string
          package_id: string
          quantity: number
          venue_id: string
        }
        Insert: {
          event_id: string
          package_id: string
          quantity?: number
          venue_id: string
        }
        Update: {
          event_id?: string
          package_id?: string
          quantity?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_packages_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_packages_venue_id_package_id_fkey"
            columns: ["venue_id", "package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      event_spaces: {
        Row: {
          event_id: string
          space_id: string
          venue_id: string
        }
        Insert: {
          event_id: string
          space_id: string
          venue_id: string
        }
        Update: {
          event_id?: string
          space_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_spaces_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spaces_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_spaces_venue_id_space_id_fkey"
            columns: ["venue_id", "space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      event_types: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          name: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name: string
          venue_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_types_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_headcount: number | null
          actual_spend: number | null
          av_requirements: string | null
          bump_in_at: string | null
          bump_out_at: string | null
          completed_at: string | null
          confirmed_ends_at: string
          confirmed_starts_at: string
          contra_booking: boolean
          created_at: string
          enquiry_id: string
          final_headcount: number | null
          id: string
          opentable_entered: boolean
          room_setup: string | null
          run_sheet_generated: boolean
          run_sheet_notes: string | null
          run_sheet_printed: boolean
          special_instructions: string | null
          staff_briefed: boolean
          venue_id: string
        }
        Insert: {
          actual_headcount?: number | null
          actual_spend?: number | null
          av_requirements?: string | null
          bump_in_at?: string | null
          bump_out_at?: string | null
          completed_at?: string | null
          confirmed_ends_at: string
          confirmed_starts_at: string
          contra_booking?: boolean
          created_at?: string
          enquiry_id: string
          final_headcount?: number | null
          id?: string
          opentable_entered?: boolean
          room_setup?: string | null
          run_sheet_generated?: boolean
          run_sheet_notes?: string | null
          run_sheet_printed?: boolean
          special_instructions?: string | null
          staff_briefed?: boolean
          venue_id: string
        }
        Update: {
          actual_headcount?: number | null
          actual_spend?: number | null
          av_requirements?: string | null
          bump_in_at?: string | null
          bump_out_at?: string | null
          completed_at?: string | null
          confirmed_ends_at?: string
          confirmed_starts_at?: string
          contra_booking?: boolean
          created_at?: string
          enquiry_id?: string
          final_headcount?: number | null
          id?: string
          opentable_entered?: boolean
          room_setup?: string | null
          run_sheet_generated?: boolean
          run_sheet_notes?: string | null
          run_sheet_printed?: boolean
          special_instructions?: string | null
          staff_briefed?: boolean
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_enquiry_id_fkey"
            columns: ["venue_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          enquiry_id: string | null
          event_id: string | null
          file_type: Database["public"]["Enums"]["file_type"]
          filename: string
          id: string
          storage_path: string
          uploaded_by: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          enquiry_id?: string | null
          event_id?: string | null
          file_type: Database["public"]["Enums"]["file_type"]
          filename: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          enquiry_id?: string | null
          event_id?: string | null
          file_type?: Database["public"]["Enums"]["file_type"]
          filename?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_venue_id_enquiry_id_fkey"
            columns: ["venue_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "files_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_files_event"
            columns: ["venue_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      holds: {
        Row: {
          created_at: string
          ends_at: string
          enquiry_id: string
          expires_at: string | null
          hold_type: Database["public"]["Enums"]["hold_type"]
          id: string
          released_at: string | null
          space_id: string
          starts_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          enquiry_id: string
          expires_at?: string | null
          hold_type: Database["public"]["Enums"]["hold_type"]
          id?: string
          released_at?: string | null
          space_id: string
          starts_at: string
          venue_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          enquiry_id?: string
          expires_at?: string | null
          hold_type?: Database["public"]["Enums"]["hold_type"]
          id?: string
          released_at?: string | null
          space_id?: string
          starts_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holds_venue_id_enquiry_id_fkey"
            columns: ["venue_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "holds_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holds_venue_id_space_id_fkey"
            columns: ["venue_id", "space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      lost_reasons: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          label: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          label: string
          venue_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_reasons_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["package_category"]
          created_at: string
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          inclusions: Json
          minimum_numbers: number | null
          name: string
          per_head_price: number | null
          venue_id: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["package_category"]
          created_at?: string
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          inclusions?: Json
          minimum_numbers?: number | null
          name: string
          per_head_price?: number | null
          venue_id: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["package_category"]
          created_at?: string
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          inclusions?: Json
          minimum_numbers?: number | null
          name?: string
          per_head_price?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          enquiry_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          received_at: string
          recorded_by: string | null
          reference: string | null
          type: Database["public"]["Enums"]["payment_type"]
          venue_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          enquiry_id: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_at?: string
          recorded_by?: string | null
          reference?: string | null
          type: Database["public"]["Enums"]["payment_type"]
          venue_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          enquiry_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_at?: string
          recorded_by?: string | null
          reference?: string | null
          type?: Database["public"]["Enums"]["payment_type"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_venue_id_enquiry_id_fkey"
            columns: ["venue_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "payments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      public_accommodation_rate_limit: {
        Row: {
          block_id: string
          count: number
          id: string
          ip_hash: string
          window_start: string
        }
        Insert: {
          block_id: string
          count?: number
          id?: string
          ip_hash: string
          window_start: string
        }
        Update: {
          block_id?: string
          count?: number
          id?: string
          ip_hash?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_accommodation_rate_limit_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "accommodation_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      public_enquiry_rate_limit: {
        Row: {
          count: number
          id: string
          ip_hash: string
          venue_id: string
          window_start: string
        }
        Insert: {
          count?: number
          id?: string
          ip_hash: string
          venue_id: string
          window_start: string
        }
        Update: {
          count?: number
          id?: string
          ip_hash?: string
          venue_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_enquiry_rate_limit_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          description: string
          display_order: number
          id: string
          line_total: number
          package_id: string | null
          quantity: number
          quote_id: string
          unit_price: number
          venue_id: string
        }
        Insert: {
          description: string
          display_order?: number
          id?: string
          line_total: number
          package_id?: string | null
          quantity?: number
          quote_id: string
          unit_price: number
          venue_id: string
        }
        Update: {
          description?: string
          display_order?: number
          id?: string
          line_total?: number
          package_id?: string | null
          quantity?: number
          quote_id?: string
          unit_price?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_venue_id_package_id_fkey"
            columns: ["venue_id", "package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          created_by: string | null
          enquiry_id: string
          gst_amount: number
          id: string
          minimum_spend_applied: number | null
          pdf_file_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          total: number
          valid_until: string | null
          venue_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enquiry_id: string
          gst_amount?: number
          id?: string
          minimum_spend_applied?: number | null
          pdf_file_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          valid_until?: string | null
          venue_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enquiry_id?: string
          gst_amount?: number
          id?: string
          minimum_spend_applied?: number | null
          pdf_file_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          total?: number
          valid_until?: string | null
          venue_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_venue_id_enquiry_id_fkey"
            columns: ["venue_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "quotes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_venue_id_pdf_file_id_fkey"
            columns: ["venue_id", "pdf_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["venue_id", "id"]
          },
        ]
      }
      reply_templates: {
        Row: {
          active: boolean
          body_template: string
          created_at: string
          id: string
          kind: string
          label: string
          lead_days: number
          subject_template: string | null
          trigger_key: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          body_template: string
          created_at?: string
          id?: string
          kind?: string
          label: string
          lead_days?: number
          subject_template?: string | null
          trigger_key: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          body_template?: string
          created_at?: string
          id?: string
          kind?: string
          label?: string
          lead_days?: number
          subject_template?: string | null
          trigger_key?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_templates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_daily_actuals: {
        Row: {
          entered_by: string | null
          id: string
          revenue_line_id: string
          source: string
          source_document_id: string | null
          trade_date: string
          updated_at: string
          value: number
          venue_id: string
        }
        Insert: {
          entered_by?: string | null
          id?: string
          revenue_line_id: string
          source: string
          source_document_id?: string | null
          trade_date: string
          updated_at?: string
          value: number
          venue_id: string
        }
        Update: {
          entered_by?: string | null
          id?: string
          revenue_line_id?: string
          source?: string
          source_document_id?: string | null
          trade_date?: string
          updated_at?: string
          value?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_daily_actuals_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_daily_actuals_revenue_line_id_fkey"
            columns: ["revenue_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_daily_actuals_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "rev_source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_daily_actuals_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_parsed_line_items: {
        Row: {
          corrected_value: number | null
          extracted_value: number
          flag: string
          id: string
          revenue_line_id: string
          source_document_id: string
          trade_date: string
        }
        Insert: {
          corrected_value?: number | null
          extracted_value: number
          flag?: string
          id?: string
          revenue_line_id: string
          source_document_id: string
          trade_date: string
        }
        Update: {
          corrected_value?: number | null
          extracted_value?: number
          flag?: string
          id?: string
          revenue_line_id?: string
          source_document_id?: string
          trade_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_parsed_line_items_revenue_line_id_fkey"
            columns: ["revenue_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_parsed_line_items_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "rev_source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_pos_location_mapping: {
        Row: {
          active: boolean
          food_line_id: string | null
          id: string
          liquor_line_id: string | null
          location_name: string
          pos_location_number: number
          venue_id: string
        }
        Insert: {
          active?: boolean
          food_line_id?: string | null
          id?: string
          liquor_line_id?: string | null
          location_name: string
          pos_location_number: number
          venue_id: string
        }
        Update: {
          active?: boolean
          food_line_id?: string | null
          id?: string
          liquor_line_id?: string | null
          location_name?: string
          pos_location_number?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_pos_location_mapping_food_line_id_fkey"
            columns: ["food_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_pos_location_mapping_liquor_line_id_fkey"
            columns: ["liquor_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_pos_location_mapping_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_revenue_line_group_members: {
        Row: {
          group_id: string
          revenue_line_id: string
        }
        Insert: {
          group_id: string
          revenue_line_id: string
        }
        Update: {
          group_id?: string
          revenue_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_revenue_line_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_line_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_revenue_line_group_members_revenue_line_id_fkey"
            columns: ["revenue_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_revenue_line_groups: {
        Row: {
          display_order: number
          id: string
          key: string
          label: string
          venue_id: string
        }
        Insert: {
          display_order: number
          id?: string
          key: string
          label: string
          venue_id: string
        }
        Update: {
          display_order?: number
          id?: string
          key?: string
          label?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_revenue_line_groups_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_revenue_lines: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          is_averaged: boolean
          key: string
          label: string
          unit: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order: number
          id?: string
          is_averaged?: boolean
          key: string
          label: string
          unit: string
          venue_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          is_averaged?: boolean
          key?: string
          label?: string
          unit?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_revenue_lines_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_source_documents: {
        Row: {
          filename: string
          id: string
          raw_extracted: Json | null
          status: string
          storage_path: string
          type: string
          uploaded_at: string
          uploaded_by: string | null
          venue_id: string
        }
        Insert: {
          filename: string
          id?: string
          raw_extracted?: Json | null
          status?: string
          storage_path: string
          type: string
          uploaded_at?: string
          uploaded_by?: string | null
          venue_id: string
        }
        Update: {
          filename?: string
          id?: string
          raw_extracted?: Json | null
          status?: string
          storage_path?: string
          type?: string
          uploaded_at?: string
          uploaded_by?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_source_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_source_documents_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_standing_targets: {
        Row: {
          amount: number
          created_at: string
          day_of_week: number
          effective_from: string
          effective_to: string | null
          group_id: string | null
          id: string
          revenue_line_id: string | null
          venue_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          day_of_week: number
          effective_from?: string
          effective_to?: string | null
          group_id?: string | null
          id?: string
          revenue_line_id?: string | null
          venue_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          day_of_week?: number
          effective_from?: string
          effective_to?: string | null
          group_id?: string | null
          id?: string
          revenue_line_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_standing_targets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_line_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_standing_targets_revenue_line_id_fkey"
            columns: ["revenue_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_standing_targets_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_weekly_targets: {
        Row: {
          amount: number
          day_of_week: number
          group_id: string | null
          id: string
          revenue_line_id: string | null
          source: string
          week_id: string
        }
        Insert: {
          amount: number
          day_of_week: number
          group_id?: string | null
          id?: string
          revenue_line_id?: string | null
          source: string
          week_id: string
        }
        Update: {
          amount?: number
          day_of_week?: number
          group_id?: string | null
          id?: string
          revenue_line_id?: string | null
          source?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_weekly_targets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_line_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_weekly_targets_revenue_line_id_fkey"
            columns: ["revenue_line_id"]
            isOneToOne: false
            referencedRelation: "rev_revenue_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_weekly_targets_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "rev_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      rev_weeks: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          status: string
          venue_id: string
          week_start_date: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          status?: string
          venue_id: string
          week_start_date: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          status?: string
          venue_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rev_weeks_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rev_weeks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          active: boolean
          capacity_cocktail: number | null
          capacity_seated: number | null
          capacity_standing: number | null
          created_at: string
          display_order: number
          id: string
          minimum_spend: number | null
          name: string
          notes: string | null
          venue_id: string
        }
        Insert: {
          active?: boolean
          capacity_cocktail?: number | null
          capacity_seated?: number | null
          capacity_standing?: number | null
          created_at?: string
          display_order?: number
          id?: string
          minimum_spend?: number | null
          name: string
          notes?: string | null
          venue_id: string
        }
        Update: {
          active?: boolean
          capacity_cocktail?: number | null
          capacity_seated?: number | null
          capacity_standing?: number | null
          created_at?: string
          display_order?: number
          id?: string
          minimum_spend?: number | null
          name?: string
          notes?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_user_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string
          enquiry_id: string | null
          event_id: string | null
          id: string
          source: string
          title: string
          venue_id: string
        }
        Insert: {
          assignee_user_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date: string
          enquiry_id?: string | null
          event_id?: string | null
          id?: string
          source?: string
          title: string
          venue_id: string
        }
        Update: {
          assignee_user_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string
          enquiry_id?: string | null
          event_id?: string | null
          id?: string
          source?: string
          title?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_event"
            columns: ["venue_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_counters: {
        Row: {
          enquiry_seq: number
          venue_id: string
        }
        Insert: {
          enquiry_seq?: number
          venue_id: string
        }
        Update: {
          enquiry_seq?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_counters_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_rms_credentials: {
        Row: {
          rms_agent_id: string | null
          rms_api_key: string | null
          rms_client_id: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          rms_agent_id?: string | null
          rms_api_key?: string | null
          rms_client_id?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          rms_agent_id?: string | null
          rms_api_key?: string | null
          rms_client_id?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_rms_credentials_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_settings: {
        Row: {
          abn: string | null
          auth_allowed_email_domain: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_bsb: string | null
          default_followup_new_enquiry_business_days: number
          default_followup_proposal_sent_business_days: number
          default_owner_user_id: string | null
          default_tentative_hold_days: number
          final_details_days_before_event: number
          final_numbers_days_before_event: number
          functions_inbox_email: string | null
          golf_max_bays: number
          golf_max_participants_per_bay: number
          golf_rate_per_bay_hour: number
          gst_rate: number
          gst_registered: boolean
          hold_expiry_warning_days: number
          legal_entity_name: string | null
          privacy_notice_url: string | null
          remittance_email: string | null
          stale_enquiry_days: number
          terms_and_conditions_file_id: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          abn?: string | null
          auth_allowed_email_domain?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_bsb?: string | null
          default_followup_new_enquiry_business_days?: number
          default_followup_proposal_sent_business_days?: number
          default_owner_user_id?: string | null
          default_tentative_hold_days?: number
          final_details_days_before_event?: number
          final_numbers_days_before_event?: number
          functions_inbox_email?: string | null
          golf_max_bays?: number
          golf_max_participants_per_bay?: number
          golf_rate_per_bay_hour?: number
          gst_rate?: number
          gst_registered?: boolean
          hold_expiry_warning_days?: number
          legal_entity_name?: string | null
          privacy_notice_url?: string | null
          remittance_email?: string | null
          stale_enquiry_days?: number
          terms_and_conditions_file_id?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          abn?: string | null
          auth_allowed_email_domain?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_bsb?: string | null
          default_followup_new_enquiry_business_days?: number
          default_followup_proposal_sent_business_days?: number
          default_owner_user_id?: string | null
          default_tentative_hold_days?: number
          final_details_days_before_event?: number
          final_numbers_days_before_event?: number
          functions_inbox_email?: string | null
          golf_max_bays?: number
          golf_max_participants_per_bay?: number
          golf_rate_per_bay_hour?: number
          gst_rate?: number
          gst_registered?: boolean
          hold_expiry_warning_days?: number
          legal_entity_name?: string | null
          privacy_notice_url?: string | null
          remittance_email?: string | null
          stale_enquiry_days?: number
          terms_and_conditions_file_id?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_venue_settings_tc_file"
            columns: ["venue_id", "terms_and_conditions_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["venue_id", "id"]
          },
          {
            foreignKeyName: "venue_settings_default_owner_user_id_fkey"
            columns: ["default_owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_settings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["venue_role"]
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["venue_role"]
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["venue_role"]
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_users_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          abn: string | null
          active: boolean
          address: string | null
          brand_config: Json
          created_at: string
          id: string
          name: string
          slug: string
          timezone: string
          trading_name: string | null
        }
        Insert: {
          abn?: string | null
          active?: boolean
          address?: string | null
          brand_config?: Json
          created_at?: string
          id?: string
          name: string
          slug: string
          timezone?: string
          trading_name?: string | null
        }
        Update: {
          abn?: string | null
          active?: boolean
          address?: string | null
          brand_config?: Json
          created_at?: string
          id?: string
          name?: string
          slug?: string
          timezone?: string
          trading_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_business_days: {
        Args: { p_days: number; p_start: string }
        Returns: string
      }
      allocate_enquiry_reference: {
        Args: { p_venue_id: string }
        Returns: string
      }
      auth_venue_ids: { Args: never; Returns: string[] }
      auth_venue_role: {
        Args: { p_venue_id: string }
        Returns: Database["public"]["Enums"]["venue_role"]
      }
      confirm_enquiry: {
        Args: {
          p_confirmed_ends_at: string
          p_confirmed_starts_at: string
          p_enquiry_id: string
          p_final_headcount?: number
          p_space_ids: string[]
        }
        Returns: {
          actual_headcount: number | null
          actual_spend: number | null
          av_requirements: string | null
          bump_in_at: string | null
          bump_out_at: string | null
          completed_at: string | null
          confirmed_ends_at: string
          confirmed_starts_at: string
          contra_booking: boolean
          created_at: string
          enquiry_id: string
          final_headcount: number | null
          id: string
          opentable_entered: boolean
          room_setup: string | null
          run_sheet_generated: boolean
          run_sheet_notes: string | null
          run_sheet_printed: boolean
          special_instructions: string | null
          staff_briefed: boolean
          venue_id: string
        }
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_public_enquiry: {
        // Six of these params are declared nullable here even though the
        // generator (as of PostgREST 14.5) omits `| null` for any function
        // arg without a SQL-level default — Postgres function parameters
        // are always callable with NULL regardless of declared type, and
        // create_public_enquiry()'s own body treats all six as optional
        // (nullif/insert-as-is). Only venue_slug/contact_name/contact_phone/
        // ip_hash are truly required (the function raises if name/phone are
        // blank). Regenerating this file wholesale will drop this widening —
        // reapply it (see DECISIONS.md) rather than casting at every call site.
        Args: {
          p_brief_description: string | null
          p_contact_email: string | null
          p_contact_name: string
          p_contact_phone: string
          p_event_type_id: string | null
          p_headcount_estimate: number | null
          p_honeypot: string | null
          p_ip_hash: string
          p_preferred_date: string | null
          p_venue_slug: string
        }
        Returns: {
          enquiry_id: string
          reference_number: string
        }[]
      }
      get_kitchen_bookings: {
        Args: { p_venue_id: string }
        Returns: {
          end_time: string
          enquiry_id: string
          event_name: string
          final_pax: number
          golf_bays_booked: number
          golf_end: string
          golf_start: string
          minors_attending: boolean
          pax_max: number
          pax_min: number
          preferred_date: string
          reference_number: string
          stage: Database["public"]["Enums"]["enquiry_stage"]
          start_time: string
        }[]
      }
      get_public_accommodation_block: {
        Args: { p_token: string }
        Returns: {
          block_id: string
          brand_config: Json
          check_in_window_end: string
          check_in_window_start: string
          nights_allowed: number
          room_type_code: string
          rooms_remaining: number
          venue_id: string
          venue_name: string
        }[]
      }
      get_public_event_types: {
        Args: { p_slug: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_public_venue_info: {
        Args: { p_slug: string }
        Returns: {
          brand_config: Json
          name: string
          privacy_notice_url: string
          venue_id: string
        }[]
      }
      next_enquiry_reference: { Args: { p_venue_id: string }; Returns: string }
      record_public_accommodation_booking: {
        // Same generator limitation as create_public_enquiry above:
        // p_guest_email/p_guest_phone/p_honeypot have no SQL-level default
        // but are genuinely nullable at the call layer, so they're widened
        // by hand here — reapply after a wholesale regeneration.
        Args: {
          p_block_token: string
          p_check_in: string
          p_check_out: string
          p_guest_email: string | null
          p_guest_name: string
          p_guest_phone: string | null
          p_honeypot: string | null
          p_ip_hash: string
          p_rms_booking_reference: string
          p_room_type_code: string
        }
        Returns: {
          booking_id: string
        }[]
      }
      update_enquiry_status: {
        Args: {
          p_enquiry_id: string
          p_reason_id?: string
          p_to_stage: Database["public"]["Enums"]["enquiry_stage"]
        }
        Returns: {
          access_time: string | null
          bar_arrangement: Database["public"]["Enums"]["bar_arrangement"] | null
          bar_tab_limit: number | null
          bar_tab_prepaid: boolean | null
          booking_form_file_id: string | null
          booking_form_signed_at: string | null
          booking_type_id: string | null
          brief_description: string | null
          budget_indication: number | null
          bump_out_deadline: string | null
          cancellation_approved_by: string | null
          cancellation_approved_reason: string | null
          cancellation_reason: string | null
          candles_approved: boolean | null
          card_on_file: boolean
          catering_ordered_at: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          decorations_notes: string | null
          deposit_amount_due: number | null
          deposit_received_at: string | null
          deposit_reference: string | null
          end_time: string | null
          event_name: string | null
          event_type_id: string | null
          external_catering_approved: boolean | null
          final_numbers_confirmed_at: string | null
          final_pax: number | null
          golf_bays_booked: number
          golf_end: string | null
          golf_external_reference: string | null
          golf_paid_at: string | null
          golf_payment_status: Database["public"]["Enums"]["golf_payment_status"]
          golf_rate_per_bay_hour: number | null
          golf_start: string | null
          id: string
          minors_attending: boolean | null
          minors_count: number | null
          minors_notes: string | null
          on_hold_release_date: string | null
          organisation_id: string | null
          owner_user_id: string | null
          pax_max: number | null
          pax_min: number | null
          payment_due_at: string | null
          payment_received_at: string | null
          preferred_date: string | null
          reference_number: string
          source: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id: string | null
          stage: Database["public"]["Enums"]["enquiry_stage"]
          start_time: string | null
          updated_at: string
          venue_id: string
          verbal_confirmation_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "enquiries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      accommodation_block_status: "active" | "closed" | "expired"
      accommodation_booking_status: "confirmed" | "cancelled"
      activity_type:
        | "note"
        | "email_sent"
        | "email_received"
        | "call"
        | "meeting"
        | "site_visit"
        | "status_change"
        | "file_upload"
      bar_arrangement: "tab" | "guests_pay_own" | "mixed"
      deposit_basis: "percent_of_minimum_spend" | "flat_fee"
      enquiry_source:
        | "phone"
        | "email"
        | "walk_in"
        | "website"
        | "social"
        | "referral"
        | "repeat"
      enquiry_stage:
        | "new_enquiry"
        | "active_enquiry"
        | "on_hold"
        | "stale"
        | "blocked"
        | "verbal_confirmation"
        | "confirmed"
        | "deposit_paid"
        | "paid_in_full"
        | "completed"
        | "cancelled"
        | "lost"
      file_type:
        | "signed_proposal"
        | "floor_plan"
        | "client_brief"
        | "invoice"
        | "other"
        | "terms_and_conditions"
      golf_payment_status: "not_required" | "invoiced" | "paid"
      hold_type: "tentative" | "confirmed"
      package_category: "food" | "beverage" | "room_hire" | "av" | "other"
      payment_method:
        | "eftpos"
        | "direct_deposit"
        | "cash"
        | "visa"
        | "mastercard"
      payment_type: "deposit" | "golf" | "balance" | "other"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "superseded"
      venue_role:
        | "admin"
        | "functions_manager"
        | "duty_manager"
        | "executive_readonly"
        | "kitchen"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accommodation_block_status: ["active", "closed", "expired"],
      accommodation_booking_status: ["confirmed", "cancelled"],
      activity_type: [
        "note",
        "email_sent",
        "email_received",
        "call",
        "meeting",
        "site_visit",
        "status_change",
        "file_upload",
      ],
      bar_arrangement: ["tab", "guests_pay_own", "mixed"],
      deposit_basis: ["percent_of_minimum_spend", "flat_fee"],
      enquiry_source: [
        "phone",
        "email",
        "walk_in",
        "website",
        "social",
        "referral",
        "repeat",
      ],
      enquiry_stage: [
        "new_enquiry",
        "active_enquiry",
        "on_hold",
        "stale",
        "blocked",
        "verbal_confirmation",
        "confirmed",
        "deposit_paid",
        "paid_in_full",
        "completed",
        "cancelled",
        "lost",
      ],
      file_type: [
        "signed_proposal",
        "floor_plan",
        "client_brief",
        "invoice",
        "other",
        "terms_and_conditions",
      ],
      golf_payment_status: ["not_required", "invoiced", "paid"],
      hold_type: ["tentative", "confirmed"],
      package_category: ["food", "beverage", "room_hire", "av", "other"],
      payment_method: [
        "eftpos",
        "direct_deposit",
        "cash",
        "visa",
        "mastercard",
      ],
      payment_type: ["deposit", "golf", "balance", "other"],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "superseded",
      ],
      venue_role: [
        "admin",
        "functions_manager",
        "duty_manager",
        "executive_readonly",
        "kitchen",
      ],
    },
  },
} as const

export type VenueRole = Database["public"]["Enums"]["venue_role"]
export type HoldType = Database["public"]["Enums"]["hold_type"]
export type PackageCategory = Database["public"]["Enums"]["package_category"]
export type FileType = Database["public"]["Enums"]["file_type"]
export type QuoteStatus = Database["public"]["Enums"]["quote_status"]
export type EnquirySource = Database["public"]["Enums"]["enquiry_source"]
export type EnquiryStage = Database["public"]["Enums"]["enquiry_stage"]
export type ActivityType = Database["public"]["Enums"]["activity_type"]
export type AccommodationBlockStatus = Database["public"]["Enums"]["accommodation_block_status"]
export type AccommodationBookingStatus = Database["public"]["Enums"]["accommodation_booking_status"]
export type DepositBasis = Database["public"]["Enums"]["deposit_basis"]
export type PaymentMethod = Database["public"]["Enums"]["payment_method"]
export type PaymentType = Database["public"]["Enums"]["payment_type"]
export type GolfPaymentStatus = Database["public"]["Enums"]["golf_payment_status"]
export type BarArrangement = Database["public"]["Enums"]["bar_arrangement"]
