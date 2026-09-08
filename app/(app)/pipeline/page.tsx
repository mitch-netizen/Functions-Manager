import Link from "next/link";
import { requireSessionContext } from "@/lib/auth/session";
import { listPipelineEnquiries } from "@/lib/domain/enquiries/queries";
import type { EnquiryStage } from "@/lib/types/database.types";

const COLUMNS: { stage: EnquiryStage; label: string }[] = [
  { stage: "new_enquiry", label: "New Enquiry" },
  { stage: "active_enquiry", label: "Active Enquiry" },
  { stage: "on_hold", label: "On Hold" },
  { stage: "stale", label: "Stale" },
  { stage: "blocked", label: "Blocked" },
  { stage: "verbal_confirmation", label: "Verbal Confirmation" },
  { stage: "confirmed", label: "Confirmed" },
  { stage: "deposit_paid", label: "Deposit Paid" },
  { stage: "paid_in_full", label: "Paid in Full" },
  { stage: "completed", label: "Completed" },
];

export default async function PipelinePage() {
  const ctx = await requireSessionContext();
  const enquiries = await listPipelineEnquiries(ctx.activeVenueId);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Pipeline</h1>
      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
        {COLUMNS.map((col) => {
          const items = enquiries.filter((e) => e.stage === col.stage);
          return (
            <div key={col.stage} className="min-w-[220px] rounded-lg bg-neutral-100 p-2">
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {col.label} <span className="font-normal">({items.length})</span>
              </h2>
              <div className="space-y-2">
                {items.map((e) => (
                  <Link
                    key={e.id}
                    href={`/enquiries/${e.id}`}
                    className="block rounded border border-neutral-200 bg-white p-3 text-sm shadow-sm hover:border-neutral-400"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.contactName}</span>
                      {e.isStale && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">stale</span>}
                    </div>
                    <div className="mt-1 text-neutral-500">
                      {e.eventTypeName ?? "Event type TBC"}
                      {e.preferredDate ? ` · ${e.preferredDate}` : ""}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-neutral-400">
                      <span>{e.paxMin ? `${e.paxMin}${e.paxMax && e.paxMax !== e.paxMin ? `-${e.paxMax}` : ""} guests` : ""}</span>
                      <span>{e.ownerName ?? ""}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
