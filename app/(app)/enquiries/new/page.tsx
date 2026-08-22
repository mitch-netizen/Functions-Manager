import { requireSessionContext } from "@/lib/auth/session";
import { listEventTypes } from "@/lib/domain/admin/event-types";
import { listSpaces } from "@/lib/domain/admin/spaces";
import { NewEnquiryForm } from "./form";

export default async function NewEnquiryPage() {
  const ctx = await requireSessionContext();
  const [eventTypes, spaces] = await Promise.all([listEventTypes(ctx.activeVenueId), listSpaces(ctx.activeVenueId)]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">New enquiry</h1>
      {eventTypes.length === 0 && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          No event types configured yet — an admin can add some under Admin → Event types. You can still log this
          enquiry without one for now.
        </p>
      )}
      <NewEnquiryForm eventTypes={eventTypes} spaces={spaces} />
    </div>
  );
}
