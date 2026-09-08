import { createClient } from "@/lib/supabase/server";
import type { HoldType } from "@/lib/types/database.types";

export interface OverlappingHold {
  holdId: string;
  holdType: HoldType;
  startsAt: string;
  endsAt: string;
  enquiryId: string;
  enquiryContactName: string;
  enquiryReferenceNumber: string;
}

interface HoldWithEnquiryRow {
  id: string;
  hold_type: HoldType;
  starts_at: string;
  ends_at: string;
  enquiry_id: string;
  enquiries: { reference_number: string; contacts: { name: string } | null } | null;
}

/** Active holds (any type) on a space overlapping a time range — used both for the pre-insert conflict-warning check and the calendar's conflict flag. */
export async function checkAvailability(venueId: string, spaceId: string, startsAt: string, endsAt: string): Promise<OverlappingHold[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holds")
    .select("id, hold_type, starts_at, ends_at, enquiry_id, enquiries(reference_number, contacts(name))")
    .eq("venue_id", venueId)
    .eq("space_id", spaceId)
    .is("released_at", null)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .returns<HoldWithEnquiryRow[]>();

  if (error) throw error;

  return (data ?? []).map((row) => ({
    holdId: row.id,
    holdType: row.hold_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    enquiryId: row.enquiry_id,
    enquiryContactName: row.enquiries?.contacts?.name ?? "",
    enquiryReferenceNumber: row.enquiries?.reference_number ?? "",
  }));
}

export interface CalendarHold extends OverlappingHold {
  spaceId: string;
  spaceName: string;
  expiresAt: string | null;
}

interface HoldWithSpaceAndEnquiryRow extends HoldWithEnquiryRow {
  space_id: string;
  expires_at: string | null;
  spaces: { name: string } | null;
}

/** Powers the calendar view — all active holds in a date range, across all spaces (or one space if given). */
export async function listHoldsInRange(venueId: string, rangeStart: string, rangeEnd: string, spaceId?: string): Promise<CalendarHold[]> {
  const supabase = await createClient();
  let query = supabase
    .from("holds")
    .select("id, hold_type, starts_at, ends_at, enquiry_id, space_id, expires_at, enquiries(reference_number, contacts(name)), spaces(name)")
    .eq("venue_id", venueId)
    .is("released_at", null)
    .lt("starts_at", rangeEnd)
    .gt("ends_at", rangeStart);

  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query.returns<HoldWithSpaceAndEnquiryRow[]>();
  if (error) throw error;

  return (data ?? []).map((row) => ({
    holdId: row.id,
    holdType: row.hold_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    enquiryId: row.enquiry_id,
    enquiryContactName: row.enquiries?.contacts?.name ?? "",
    enquiryReferenceNumber: row.enquiries?.reference_number ?? "",
    spaceId: row.space_id,
    spaceName: row.spaces?.name ?? "",
    expiresAt: row.expires_at,
  }));
}

export interface EnquiryHold {
  holdId: string;
  holdType: HoldType;
  startsAt: string;
  endsAt: string;
  spaceName: string;
  expiresAt: string | null;
}

export async function listHoldsForEnquiry(enquiryId: string): Promise<EnquiryHold[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holds")
    .select("id, hold_type, starts_at, ends_at, expires_at, spaces(name)")
    .eq("enquiry_id", enquiryId)
    .is("released_at", null)
    .order("starts_at")
    .returns<{ id: string; hold_type: HoldType; starts_at: string; ends_at: string; expires_at: string | null; spaces: { name: string } | null }[]>();

  if (error) throw error;

  return (data ?? []).map((row) => ({
    holdId: row.id,
    holdType: row.hold_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    spaceName: row.spaces?.name ?? "",
    expiresAt: row.expires_at,
  }));
}
