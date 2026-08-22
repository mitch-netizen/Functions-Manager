import { requireSessionContext } from "@/lib/auth/session";
import { listEventTypes } from "@/lib/domain/admin/event-types";
import { EventTypesEditor } from "./editor";

export default async function EventTypesAdminPage() {
  const ctx = await requireSessionContext();
  const eventTypes = await listEventTypes(ctx.activeVenueId, true);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Event types</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Shown as options on the enquiry capture form. Each venue configures its own — nothing here is shared
        across venues.
      </p>
      {eventTypes.length === 0 && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Nothing configured yet — add your venue&apos;s event types below to get started.
        </p>
      )}
      <EventTypesEditor eventTypes={eventTypes} />
    </div>
  );
}
