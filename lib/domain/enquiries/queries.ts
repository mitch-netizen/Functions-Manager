import { createClient } from "@/lib/supabase/server";
import type { ActivityType, EnquiryStatus } from "@/lib/types/database.types";

export interface PipelineFilters {
  ownerUserId?: string;
  eventTypeId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PipelineEnquiry {
  id: string;
  referenceNumber: string;
  contactName: string;
  eventTypeName: string | null;
  preferredDate: string | null;
  headcountEstimate: number | null;
  status: EnquiryStatus;
  ownerName: string | null;
  lastActivityAt: string;
  isStale: boolean;
}

/** Powers the pipeline kanban (brief view 1). Grouping by status happens client-side from this flat list. */
export async function listPipelineEnquiries(venueId: string, filters: PipelineFilters = {}): Promise<PipelineEnquiry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("enquiries")
    .select(
      "id, reference_number, contact_name, preferred_date, headcount_estimate, status, updated_at, event_types(name), profiles!enquiries_owner_user_id_fkey(full_name, email)"
    )
    .eq("venue_id", venueId)
    .order("updated_at", { ascending: false });

  if (filters.ownerUserId) query = query.eq("owner_user_id", filters.ownerUserId);
  if (filters.eventTypeId) query = query.eq("event_type_id", filters.eventTypeId);
  if (filters.fromDate) query = query.gte("preferred_date", filters.fromDate);
  if (filters.toDate) query = query.lte("preferred_date", filters.toDate);

  const { data, error } = await query.returns<
    {
      id: string;
      reference_number: string;
      contact_name: string;
      preferred_date: string | null;
      headcount_estimate: number | null;
      status: EnquiryStatus;
      updated_at: string;
      event_types: { name: string } | null;
      profiles: { full_name: string | null; email: string } | null;
    }[]
  >();

  if (error) throw error;

  const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return (data ?? []).map((row) => ({
    id: row.id,
    referenceNumber: row.reference_number,
    contactName: row.contact_name,
    eventTypeName: row.event_types?.name ?? null,
    preferredDate: row.preferred_date,
    headcountEstimate: row.headcount_estimate,
    status: row.status,
    ownerName: row.profiles?.full_name ?? row.profiles?.email ?? null,
    lastActivityAt: row.updated_at,
    isStale:
      !["completed", "lost", "cancelled"].includes(row.status) && now - new Date(row.updated_at).getTime() > staleThresholdMs,
  }));
}

export interface EnquiryDetail {
  id: string;
  referenceNumber: string;
  status: EnquiryStatus;
  source: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string;
  organisation: string | null;
  eventTypeId: string | null;
  eventTypeName: string | null;
  spacePreferenceId: string | null;
  spacePreferenceName: string | null;
  preferredDate: string | null;
  dateFlexible: boolean;
  headcountEstimate: number | null;
  budgetIndication: number | null;
  briefDescription: string | null;
  ownerUserId: string | null;
  createdAt: string;
}

export async function getEnquiryById(id: string): Promise<EnquiryDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "id, reference_number, status, source, contact_name, contact_email, contact_phone, organisation, event_type_id, space_preference_id, preferred_date, date_flexible, headcount_estimate, budget_indication, brief_description, owner_user_id, created_at, event_types(name), spaces(name)"
    )
    .eq("id", id)
    .maybeSingle<{
      id: string;
      reference_number: string;
      status: EnquiryStatus;
      source: string;
      contact_name: string;
      contact_email: string | null;
      contact_phone: string;
      organisation: string | null;
      event_type_id: string | null;
      space_preference_id: string | null;
      preferred_date: string | null;
      date_flexible: boolean;
      headcount_estimate: number | null;
      budget_indication: number | null;
      brief_description: string | null;
      owner_user_id: string | null;
      created_at: string;
      event_types: { name: string } | null;
      spaces: { name: string } | null;
    }>();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    referenceNumber: data.reference_number,
    status: data.status,
    source: data.source,
    contactName: data.contact_name,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    organisation: data.organisation,
    eventTypeId: data.event_type_id,
    eventTypeName: data.event_types?.name ?? null,
    spacePreferenceId: data.space_preference_id,
    spacePreferenceName: data.spaces?.name ?? null,
    preferredDate: data.preferred_date,
    dateFlexible: data.date_flexible,
    headcountEstimate: data.headcount_estimate,
    budgetIndication: data.budget_indication,
    briefDescription: data.brief_description,
    ownerUserId: data.owner_user_id,
    createdAt: data.created_at,
  };
}

export interface TimelineEntry {
  id: string;
  type: ActivityType;
  body: string | null;
  actorName: string | null;
  createdAt: string;
}

export async function getEnquiryTimeline(enquiryId: string): Promise<TimelineEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("id, type, body, created_at, profiles(full_name, email)")
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: false })
    .returns<{ id: string; type: ActivityType; body: string | null; created_at: string; profiles: { full_name: string | null; email: string } | null }[]>();

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    body: row.body,
    actorName: row.profiles?.full_name ?? row.profiles?.email ?? null,
    createdAt: row.created_at,
  }));
}
