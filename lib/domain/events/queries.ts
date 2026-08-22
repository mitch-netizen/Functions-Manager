import { createClient } from "@/lib/supabase/server";

export interface DietaryRequirement {
  id: string;
  requirement: string;
  headcount: number;
}

export interface EventDetail {
  id: string;
  enquiryId: string;
  contactName: string;
  referenceNumber: string;
  finalHeadcount: number | null;
  confirmedStartsAt: string;
  confirmedEndsAt: string;
  bumpInAt: string | null;
  bumpOutAt: string | null;
  roomSetup: string | null;
  avRequirements: string | null;
  specialInstructions: string | null;
  runSheetNotes: string | null;
  actualHeadcount: number | null;
  actualSpend: number | null;
  completedAt: string | null;
  spaceNames: string[];
  dietaryRequirements: DietaryRequirement[];
}

interface EventRow {
  id: string;
  enquiry_id: string;
  final_headcount: number | null;
  confirmed_starts_at: string;
  confirmed_ends_at: string;
  bump_in_at: string | null;
  bump_out_at: string | null;
  room_setup: string | null;
  av_requirements: string | null;
  special_instructions: string | null;
  run_sheet_notes: string | null;
  actual_headcount: number | null;
  actual_spend: number | null;
  completed_at: string | null;
  enquiries: { contact_name: string; reference_number: string } | null;
}

const EVENT_SELECT =
  "id, enquiry_id, final_headcount, confirmed_starts_at, confirmed_ends_at, bump_in_at, bump_out_at, room_setup, av_requirements, special_instructions, run_sheet_notes, actual_headcount, actual_spend, completed_at, enquiries(contact_name, reference_number)";

async function hydrateEvent(event: EventRow): Promise<EventDetail> {
  const supabase = await createClient();
  const [{ data: eventSpaces }, { data: dietary }] = await Promise.all([
    supabase.from("event_spaces").select("spaces(name)").eq("event_id", event.id).returns<{ spaces: { name: string } | null }[]>(),
    supabase.from("event_dietary_requirements").select("id, requirement, headcount").eq("event_id", event.id),
  ]);

  return {
    id: event.id,
    enquiryId: event.enquiry_id,
    contactName: event.enquiries?.contact_name ?? "",
    referenceNumber: event.enquiries?.reference_number ?? "",
    finalHeadcount: event.final_headcount,
    confirmedStartsAt: event.confirmed_starts_at,
    confirmedEndsAt: event.confirmed_ends_at,
    bumpInAt: event.bump_in_at,
    bumpOutAt: event.bump_out_at,
    roomSetup: event.room_setup,
    avRequirements: event.av_requirements,
    specialInstructions: event.special_instructions,
    runSheetNotes: event.run_sheet_notes,
    actualHeadcount: event.actual_headcount,
    actualSpend: event.actual_spend,
    completedAt: event.completed_at,
    spaceNames: (eventSpaces ?? []).map((s) => s.spaces?.name ?? "").filter(Boolean),
    dietaryRequirements: (dietary ?? []).map((d) => ({ id: d.id, requirement: d.requirement, headcount: d.headcount })),
  };
}

export async function getEventByEnquiryId(enquiryId: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("enquiry_id", enquiryId)
    .maybeSingle<EventRow>();

  if (error) throw error;
  if (!event) return null;
  return hydrateEvent(event);
}

export async function getEventById(eventId: string): Promise<EventDetail | null> {
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", eventId)
    .maybeSingle<EventRow>();

  if (error) throw error;
  if (!event) return null;
  return hydrateEvent(event);
}
