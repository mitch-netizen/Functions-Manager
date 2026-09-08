import { startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { EnquiryStage } from "@/lib/types/database.types";

export interface DashboardStats {
  enquiriesReceivedThisPeriod: number;
  conversionRate: number; // confirmed-family+completed / (received this period), 0-1
  confirmedForwardRevenueByMonth: { month: string; total: number }[];
  averageEventValue: number | null;
  pipelineValueWeighted: number;
  staleEnquiryCount: number;
  sourceBreakdown: { source: string; count: number }[];
}

// A judgment call (see DECISIONS.md): the brief asks for "pipeline value
// weighted by stage" without specifying weights. These approximate how
// likely an enquiry at each stage is to convert, applied to its latest
// quote total (or budget_indication if no quote exists yet).
const STAGE_WEIGHTS: Record<EnquiryStage, number> = {
  new_enquiry: 0.1,
  active_enquiry: 0.25,
  on_hold: 0.3,
  stale: 0.05,
  blocked: 0.05,
  verbal_confirmation: 0.6,
  confirmed: 0.85,
  deposit_paid: 0.95,
  paid_in_full: 1,
  completed: 1,
  lost: 0,
  cancelled: 0,
};

const CONFIRMED_FAMILY_STAGES: EnquiryStage[] = ["confirmed", "deposit_paid", "paid_in_full", "completed"];
const OPEN_STAGES: EnquiryStage[] = [
  "new_enquiry",
  "active_enquiry",
  "on_hold",
  "stale",
  "blocked",
  "verbal_confirmation",
  "confirmed",
  "deposit_paid",
  "paid_in_full",
];

export async function getDashboardStats(venueId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const periodStart = startOfMonth(new Date()).toISOString();

  const { count: enquiriesReceivedThisPeriod } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .gte("created_at", periodStart);

  const { count: confirmedOrCompletedThisPeriod } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId)
    .gte("created_at", periodStart)
    .in("stage", CONFIRMED_FAMILY_STAGES);

  const conversionRate =
    enquiriesReceivedThisPeriod && enquiriesReceivedThisPeriod > 0
      ? (confirmedOrCompletedThisPeriod ?? 0) / enquiriesReceivedThisPeriod
      : 0;

  const { data: sourceRows } = await supabase.from("enquiries").select("source").eq("venue_id", venueId);
  const sourceCounts = new Map<string, number>();
  for (const row of sourceRows ?? []) sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1);
  const sourceBreakdown = Array.from(sourceCounts.entries()).map(([source, count]) => ({ source, count }));

  const { data: openEnquiries } = await supabase
    .from("enquiries")
    .select("id, stage, budget_indication")
    .eq("venue_id", venueId)
    .in("stage", OPEN_STAGES);

  const { data: latestQuotesByEnquiry } = await supabase
    .from("quotes")
    .select("enquiry_id, total, version")
    .eq("venue_id", venueId)
    .order("version", { ascending: false });
  const latestQuoteTotal = new Map<string, number>();
  for (const q of latestQuotesByEnquiry ?? []) {
    if (!latestQuoteTotal.has(q.enquiry_id)) latestQuoteTotal.set(q.enquiry_id, q.total);
  }

  let pipelineValueWeighted = 0;
  for (const enquiry of openEnquiries ?? []) {
    const value = latestQuoteTotal.get(enquiry.id) ?? enquiry.budget_indication ?? 0;
    pipelineValueWeighted += value * STAGE_WEIGHTS[enquiry.stage];
  }

  const { data: confirmedEvents } = await supabase
    .from("events")
    .select("enquiry_id, confirmed_starts_at")
    .eq("venue_id", venueId)
    .is("completed_at", null);
  const revenueByMonth = new Map<string, number>();
  for (const event of confirmedEvents ?? []) {
    const month = event.confirmed_starts_at.slice(0, 7); // yyyy-mm
    const value = latestQuoteTotal.get(event.enquiry_id) ?? 0;
    revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + value);
  }
  const confirmedForwardRevenueByMonth = Array.from(revenueByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  const { data: completedEvents } = await supabase.from("events").select("actual_spend").eq("venue_id", venueId).not("actual_spend", "is", null);
  const averageEventValue =
    completedEvents && completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + (e.actual_spend ?? 0), 0) / completedEvents.length
      : null;

  const { data: staleCandidates } = await supabase
    .from("enquiries")
    .select("id, updated_at")
    .eq("venue_id", venueId)
    .in("stage", OPEN_STAGES);
  const { data: settings } = await supabase.from("venue_settings").select("stale_enquiry_days").eq("venue_id", venueId).single();
  const staleDays = settings?.stale_enquiry_days ?? 7;
  const staleThreshold = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  const staleEnquiryCount = (staleCandidates ?? []).filter((e) => new Date(e.updated_at).getTime() < staleThreshold).length;

  return {
    enquiriesReceivedThisPeriod: enquiriesReceivedThisPeriod ?? 0,
    conversionRate,
    confirmedForwardRevenueByMonth,
    averageEventValue,
    pipelineValueWeighted,
    staleEnquiryCount,
    sourceBreakdown,
  };
}
