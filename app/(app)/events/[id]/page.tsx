import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventById } from "@/lib/domain/events/queries";
import { listAccommodationBlocksForEvent } from "@/lib/domain/accommodation/queries";
import { EventDetailsForm } from "./details-form";
import { DietaryPanel } from "./dietary-panel";
import { CompleteEventForm } from "./complete-form";
import { AccommodationPanel } from "./accommodation-panel";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, accommodationBlocks] = await Promise.all([getEventById(id), listAccommodationBlocksForEvent(id)]);
  if (!event) notFound();

  const now = new Date();
  const daysUntilEvent = Math.ceil((new Date(event.confirmedStartsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const finalDetailsIncomplete =
    !event.completedAt &&
    daysUntilEvent <= 7 &&
    daysUntilEvent >= 0 &&
    (event.dietaryRequirements.length === 0 || !event.finalHeadcount);

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{event.contactName}</h1>
            <span className="text-sm text-neutral-400">{event.referenceNumber}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            {new Date(event.confirmedStartsAt).toLocaleString()} – {new Date(event.confirmedEndsAt).toLocaleString()}
          </p>
          <p className="text-sm text-neutral-600">{event.spaceNames.join(", ") || "No space recorded"}</p>

          {finalDetailsIncomplete && (
            <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-800">
              This event is within 7 days and still missing final numbers or dietary requirements.
            </p>
          )}

          <Link
            href={`/api/pdf/run-sheet/${event.id}`}
            target="_blank"
            className="mt-3 inline-block rounded bg-neutral-900 px-3 py-1.5 text-sm text-white"
          >
            Generate run sheet
          </Link>
        </div>

        <EventDetailsForm event={event} />
        <DietaryPanel eventId={event.id} dietaryRequirements={event.dietaryRequirements} />
        <AccommodationPanel eventId={event.id} blocks={accommodationBlocks} />
      </div>

      <div>
        <CompleteEventForm
          eventId={event.id}
          enquiryId={event.enquiryId}
          completedAt={event.completedAt}
          actualHeadcount={event.actualHeadcount}
          actualSpend={event.actualSpend}
        />
      </div>
    </div>
  );
}
