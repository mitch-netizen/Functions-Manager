import { createClient } from "@/lib/supabase/server";
import type { ActivityType, EnquiryStage } from "@/lib/types/database.types";

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
  organisationName: string | null;
  eventTypeName: string | null;
  preferredDate: string | null;
  paxMin: number | null;
  paxMax: number | null;
  stage: EnquiryStage;
  ownerName: string | null;
  lastActivityAt: string;
  isStale: boolean;
}

const CLOSED_STAGES: EnquiryStage[] = ["completed", "lost", "cancelled"];

/** Powers the pipeline kanban (brief view 1). Grouping by stage happens client-side from this flat list. */
export async function listPipelineEnquiries(venueId: string, filters: PipelineFilters = {}): Promise<PipelineEnquiry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("enquiries")
    .select(
      "id, reference_number, preferred_date, pax_min, pax_max, stage, updated_at, event_types(name), contacts(name), organisations(name), profiles!enquiries_owner_user_id_fkey(full_name, email)"
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
      preferred_date: string | null;
      pax_min: number | null;
      pax_max: number | null;
      stage: EnquiryStage;
      updated_at: string;
      event_types: { name: string } | null;
      contacts: { name: string } | null;
      organisations: { name: string } | null;
      profiles: { full_name: string | null; email: string } | null;
    }[]
  >();

  if (error) throw error;

  const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return (data ?? []).map((row) => ({
    id: row.id,
    referenceNumber: row.reference_number,
    contactName: row.contacts?.name ?? "",
    organisationName: row.organisations?.name ?? null,
    eventTypeName: row.event_types?.name ?? null,
    preferredDate: row.preferred_date,
    paxMin: row.pax_min,
    paxMax: row.pax_max,
    stage: row.stage,
    ownerName: row.profiles?.full_name ?? row.profiles?.email ?? null,
    lastActivityAt: row.updated_at,
    isStale: !CLOSED_STAGES.includes(row.stage) && now - new Date(row.updated_at).getTime() > staleThresholdMs,
  }));
}

export interface EnquiryDetail {
  id: string;
  referenceNumber: string;
  stage: EnquiryStage;
  source: string;
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  organisationId: string | null;
  organisationName: string | null;
  eventTypeId: string | null;
  eventTypeName: string | null;
  spacePreferenceId: string | null;
  spacePreferenceName: string | null;
  preferredDate: string | null;
  paxMin: number | null;
  paxMax: number | null;
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
      "id, reference_number, stage, source, contact_id, organisation_id, event_type_id, space_preference_id, preferred_date, pax_min, pax_max, budget_indication, brief_description, owner_user_id, created_at, event_types(name), spaces(name), contacts(name, email, phone), organisations(name)"
    )
    .eq("id", id)
    .maybeSingle<{
      id: string;
      reference_number: string;
      stage: EnquiryStage;
      source: string;
      contact_id: string;
      organisation_id: string | null;
      event_type_id: string | null;
      space_preference_id: string | null;
      preferred_date: string | null;
      pax_min: number | null;
      pax_max: number | null;
      budget_indication: number | null;
      brief_description: string | null;
      owner_user_id: string | null;
      created_at: string;
      event_types: { name: string } | null;
      spaces: { name: string } | null;
      contacts: { name: string; email: string | null; phone: string | null } | null;
      organisations: { name: string } | null;
    }>();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    referenceNumber: data.reference_number,
    stage: data.stage,
    source: data.source,
    contactId: data.contact_id,
    contactName: data.contacts?.name ?? "",
    contactEmail: data.contacts?.email ?? null,
    contactPhone: data.contacts?.phone ?? null,
    organisationId: data.organisation_id,
    organisationName: data.organisations?.name ?? null,
    eventTypeId: data.event_type_id,
    eventTypeName: data.event_types?.name ?? null,
    spacePreferenceId: data.space_preference_id,
    spacePreferenceName: data.spaces?.name ?? null,
    preferredDate: data.preferred_date,
    paxMin: data.pax_min,
    paxMax: data.pax_max,
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
