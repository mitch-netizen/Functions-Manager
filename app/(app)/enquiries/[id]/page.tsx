import { notFound } from "next/navigation";
import { requireSessionContext } from "@/lib/auth/session";
import { getEnquiryById, getEnquiryTimeline } from "@/lib/domain/enquiries/queries";
import { listTasksForEnquiry } from "@/lib/domain/tasks/queries";
import { listLostReasons } from "@/lib/domain/admin/lost-reasons";
import { listSpaces } from "@/lib/domain/admin/spaces";
import { listHoldsForEnquiry } from "@/lib/domain/holds/queries";
import { listPackages } from "@/lib/domain/admin/packages";
import { listQuotesForEnquiry, getQuoteDetail } from "@/lib/domain/quotes/queries";
import { StatusControl } from "./status-control";
import { ActivityForm } from "./activity-form";
import { TaskPanel } from "./task-panel";
import { HoldsPanel } from "./holds-panel";
import { QuotesPanel } from "./quotes-panel";

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireSessionContext();
  const enquiry = await getEnquiryById(id);
  if (!enquiry) notFound();

  const [timeline, tasks, lostReasons, spaces, holds, packages, quotes] = await Promise.all([
    getEnquiryTimeline(id),
    listTasksForEnquiry(id),
    listLostReasons(ctx.activeVenueId),
    listSpaces(ctx.activeVenueId),
    listHoldsForEnquiry(id),
    listPackages(ctx.activeVenueId),
    listQuotesForEnquiry(id),
  ]);
  const draftDetail = quotes[0]?.status === "draft" ? await getQuoteDetail(quotes[0].id) : null;

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{enquiry.contactName}</h1>
            <span className="text-sm text-neutral-400">{enquiry.referenceNumber}</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-700">
            <Detail label="Phone" value={enquiry.contactPhone} />
            <Detail label="Email" value={enquiry.contactEmail ?? "—"} />
            <Detail label="Organisation" value={enquiry.organisation ?? "—"} />
            <Detail label="Event type" value={enquiry.eventTypeName ?? "—"} />
            <Detail label="Space preference" value={enquiry.spacePreferenceName ?? "—"} />
            <Detail label="Preferred date" value={enquiry.preferredDate ?? "—"} />
            <Detail label="Headcount" value={enquiry.headcountEstimate ? String(enquiry.headcountEstimate) : "—"} />
            <Detail label="Budget" value={enquiry.budgetIndication ? `$${enquiry.budgetIndication}` : "—"} />
            <Detail label="Source" value={enquiry.source} />
          </dl>
          {enquiry.briefDescription && <p className="mt-3 text-sm text-neutral-600">{enquiry.briefDescription}</p>}
        </div>

        <StatusControl enquiryId={enquiry.id} currentStatus={enquiry.status} lostReasons={lostReasons} />

        <div>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">Activity</h2>
          <ActivityForm enquiryId={enquiry.id} />
          <ul className="mt-3 space-y-2">
            {timeline.map((entry) => (
              <li key={entry.id} className="rounded border border-neutral-200 bg-white p-2 text-sm">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="uppercase tracking-wide text-xs">{entry.type.replace("_", " ")}</span>
                  <span className="text-xs">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                {entry.body && <p className="mt-1 text-neutral-800">{entry.body}</p>}
                {entry.actorName && <p className="mt-1 text-xs text-neutral-400">{entry.actorName}</p>}
              </li>
            ))}
            {timeline.length === 0 && <li className="text-sm text-neutral-400">No activity yet.</li>}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <TaskPanel enquiryId={enquiry.id} tasks={tasks} />
        <HoldsPanel enquiryId={enquiry.id} spaces={spaces} holds={holds} />
        <QuotesPanel enquiryId={enquiry.id} quotes={quotes} draftDetail={draftDetail} packages={packages} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
