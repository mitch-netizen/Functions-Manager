import { NextResponse } from "next/server";
import { requireSessionContext } from "@/lib/auth/session";
import { listPipelineEnquiries, type PipelineFilters } from "@/lib/domain/enquiries/queries";
import { toCsv } from "@/lib/csv/export";

// One route for every exportable list view, reusing the exact same
// RLS-scoped queries those views already call — an export can never
// exceed what the view itself would show. Add a resource here only by
// wiring in an existing list query, never a bespoke one.
export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const ctx = await requireSessionContext();
  const searchParams = new URL(request.url).searchParams;

  if (resource === "enquiries") {
    const filters: PipelineFilters = {
      ownerUserId: searchParams.get("ownerUserId") ?? undefined,
      eventTypeId: searchParams.get("eventTypeId") ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
    };

    const enquiries = await listPipelineEnquiries(ctx.activeVenueId, filters);
    const csv = toCsv(
      enquiries.map((e) => ({ ...e, isStale: e.isStale ? "yes" : "no" })),
      [
        { key: "referenceNumber", header: "Reference" },
        { key: "contactName", header: "Contact" },
        { key: "eventTypeName", header: "Event type" },
        { key: "preferredDate", header: "Preferred date" },
        { key: "headcountEstimate", header: "Headcount" },
        { key: "status", header: "Status" },
        { key: "ownerName", header: "Owner" },
        { key: "lastActivityAt", header: "Last activity" },
        { key: "isStale", header: "Stale" },
      ]
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="enquiries-export.csv"`,
      },
    });
  }

  return NextResponse.json({ error: `unknown export resource: ${resource}` }, { status: 404 });
}
