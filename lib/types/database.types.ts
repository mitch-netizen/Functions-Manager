// Generated from the live "The Queens" Supabase project
// (zbzoymnunjwwgwgklaui, ap-southeast-2) via
// `mcp__Supabase__generate_typescript_types` after applying every migration
// through 20260822160000_p8_accommodation_and_opentable.sql. Never
// hand-edited beyond the two narrow, documented deviations below —
// regenerate wholesale after any future migration and reapply both:
//
// 1. Two RPC Args blocks (create_public_enquiry, below and
//    record_public_accommodation_booking) have several params widened to
//    `| null` by hand. The generator (PostgREST 14.15) omits `| null` from
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
    PostgrestVersion: "14.15"
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
        Relationships: []
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
      enquiries: {
        Row: {
          alternate_dates: string[] | null
          brief_description: string | null
          budget_indication: number | null
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          created_by: string | null
          date_flexible: boolean
          event_type_id: string | null
          headcount_estimate: number | null
          id: string
          organisation: string | null
          owner_user_id: string | null
          preferred_date: string | null
          reference_number: string
          source: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
          venue_id: string
        }
        Insert: {
          alternate_dates?: string[] | null
          brief_description?: string | null
          budget_indication?: number | null
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          created_by?: string | null
          date_flexible?: boolean
          event_type_id?: string | null
          headcount_estimate?: number | null
          id?: string
          organisation?: string | null
          owner_user_id?: string | null
          preferred_date?: string | null
          reference_number: string
          source: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          venue_id: string
        }
        Update: {
          alternate_dates?: string[] | null
          brief_description?: string | null
          budget_indication?: number | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          date_flexible?: boolean
          event_type_id?: string | null
          headcount_estimate?: number | null
          id?: string
          organisation?: string | null
          owner_user_id?: string | null
          preferred_date?: string | null
          reference_number?: string
          source?: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
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
          from_status: Database["public"]["Enums"]["enquiry_status"] | null
          id: string
          reason_id: string | null
          to_status: Database["public"]["Enums"]["enquiry_status"]
          venue_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          enquiry_id: string
          from_status?: Database["public"]["Enums"]["enquiry_status"] | null
          id?: string
          reason_id?: string | null
          to_status: Database["public"]["Enums"]["enquiry_status"]
          venue_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          enquiry_id?: string
          from_status?: Database["public"]["Enums"]["enquiry_status"] | null
          id?: string
          reason_id?: string | null
          to_status?: Database["public"]["Enums"]["enquiry_status"]
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
          created_at: string
          enquiry_id: string
          final_headcount: number | null
          id: string
          room_setup: string | null
          run_sheet_notes: string | null
          special_instructions: string | null
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
          created_at?: string
          enquiry_id: string
          final_headcount?: number | null
          id?: string
          room_setup?: string | null
          run_sheet_notes?: string | null
          special_instructions?: string | null
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
          created_at?: string
          enquiry_id?: string
          final_headcount?: number | null
          id?: string
          room_setup?: string | null
          run_sheet_notes?: string | null
          special_instructions?: string | null
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
          default_followup_new_enquiry_business_days: number
          default_followup_proposal_sent_business_days: number
          default_owner_user_id: string | null
          default_tentative_hold_days: number
          final_details_days_before_event: number
          final_numbers_days_before_event: number
          gst_rate: number
          hold_expiry_warning_days: number
          legal_entity_name: string | null
          privacy_notice_url: string | null
          stale_enquiry_days: number
          terms_and_conditions_file_id: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          default_followup_new_enquiry_business_days?: number
          default_followup_proposal_sent_business_days?: number
          default_owner_user_id?: string | null
          default_tentative_hold_days?: number
          final_details_days_before_event?: number
          final_numbers_days_before_event?: number
          gst_rate?: number
          hold_expiry_warning_days?: number
          legal_entity_name?: string | null
          privacy_notice_url?: string | null
          stale_enquiry_days?: number
          terms_and_conditions_file_id?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          default_followup_new_enquiry_business_days?: number
          default_followup_proposal_sent_business_days?: number
          default_owner_user_id?: string | null
          default_tentative_hold_days?: number
          final_details_days_before_event?: number
          final_numbers_days_before_event?: number
          gst_rate?: number
          hold_expiry_warning_days?: number
          legal_entity_name?: string | null
          privacy_notice_url?: string | null
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
      auth_venue_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
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
          created_at: string
          enquiry_id: string
          final_headcount: number | null
          id: string
          room_setup: string | null
          run_sheet_notes: string | null
          special_instructions: string | null
          venue_id: string
        }
      }
      create_public_enquiry: {
        // Six of these params are declared nullable here even though the
        // generator (as of PostgREST 14.15) omits `| null` for any function
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
          p_to_status: Database["public"]["Enums"]["enquiry_status"]
        }
        Returns: {
          alternate_dates: string[] | null
          brief_description: string | null
          budget_indication: number | null
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          created_by: string | null
          date_flexible: boolean
          event_type_id: string | null
          headcount_estimate: number | null
          id: string
          organisation: string | null
          owner_user_id: string | null
          preferred_date: string | null
          reference_number: string
          source: Database["public"]["Enums"]["enquiry_source"]
          space_preference_id: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
          venue_id: string
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
      enquiry_source:
        | "phone"
        | "email"
        | "walk_in"
        | "website"
        | "social"
        | "referral"
        | "repeat"
      enquiry_status:
        | "new"
        | "qualifying"
        | "proposal_sent"
        | "tentative"
        | "confirmed"
        | "completed"
        | "lost"
        | "cancelled"
      file_type:
        | "signed_proposal"
        | "floor_plan"
        | "client_brief"
        | "invoice"
        | "other"
        | "terms_and_conditions"
      hold_type: "tentative" | "confirmed"
      package_category: "food" | "beverage" | "room_hire" | "av" | "other"
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
        | "superseded"
      venue_role: "admin" | "manager" | "coordinator" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      enquiry_source: [
        "phone",
        "email",
        "walk_in",
        "website",
        "social",
        "referral",
        "repeat",
      ],
      enquiry_status: [
        "new",
        "qualifying",
        "proposal_sent",
        "tentative",
        "confirmed",
        "completed",
        "lost",
        "cancelled",
      ],
      file_type: [
        "signed_proposal",
        "floor_plan",
        "client_brief",
        "invoice",
        "other",
        "terms_and_conditions",
      ],
      hold_type: ["tentative", "confirmed"],
      package_category: ["food", "beverage", "room_hire", "av", "other"],
      quote_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "expired",
        "superseded",
      ],
      venue_role: ["admin", "manager", "coordinator", "viewer"],
    },
  },
} as const

// Convenience aliases (not part of the generator's output — see file header).
export type VenueRole = Database["public"]["Enums"]["venue_role"];
export type HoldType = Database["public"]["Enums"]["hold_type"];
export type PackageCategory = Database["public"]["Enums"]["package_category"];
export type FileType = Database["public"]["Enums"]["file_type"];
export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
export type EnquirySource = Database["public"]["Enums"]["enquiry_source"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];
export type ActivityType = Database["public"]["Enums"]["activity_type"];
export type AccommodationBlockStatus = Database["public"]["Enums"]["accommodation_block_status"];
export type AccommodationBookingStatus = Database["public"]["Enums"]["accommodation_booking_status"];
