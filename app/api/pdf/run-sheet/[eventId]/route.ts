import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/domain/events/queries";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { RunSheetPdf } from "@/lib/pdf/run-sheet-template";

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  // RLS-scoped read: getEventById can only see the event if the
  // requesting user's session has venue access to it — no separate
  // authorization check needed here.
  const supabase = await createClient();
  const { data: venueRow } = await supabase.from("events").select("venue_id").eq("id", eventId).maybeSingle();
  if (!venueRow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: venue } = await supabase.from("venues").select("name").eq("id", venueRow.venue_id).single();

  const event = await getEventById(eventId);
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  const pdfBuffer = await renderPdfToBuffer(RunSheetPdf({ venueName: venue?.name ?? "", event }));

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="run-sheet-${event.referenceNumber}.pdf"`,
    },
  });
}
