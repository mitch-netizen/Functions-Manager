import { requireSessionContext } from "@/lib/auth/session";
import { listSpaces } from "@/lib/domain/admin/spaces";
import { SpacesEditor } from "./editor";

export default async function SpacesAdminPage() {
  const ctx = await requireSessionContext();
  const spaces = await listSpaces(ctx.activeVenueId, true);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Spaces</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Bookable spaces for this venue — used for holds, the calendar, and the enquiry capture form&apos;s space
        preference field. Each venue configures its own.
      </p>
      {spaces.length === 0 && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Nothing configured yet — add your venue&apos;s bookable spaces below to get started.
        </p>
      )}
      <SpacesEditor spaces={spaces} />
    </div>
  );
}
