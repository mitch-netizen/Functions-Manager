import { requireSessionContext } from "@/lib/auth/session";
import { getVenueGeneralSettings } from "@/lib/domain/admin/venue-settings";
import { listVenueUsers } from "@/lib/domain/admin/venue-users";
import { VenueSettingsForm } from "./form";

export default async function VenueSettingsAdminPage() {
  const ctx = await requireSessionContext();
  const [settings, users] = await Promise.all([
    getVenueGeneralSettings(ctx.activeVenueId),
    listVenueUsers(ctx.activeVenueId),
  ]);

  if (!settings) return <p className="text-sm text-neutral-500">Venue not found.</p>;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Venue settings</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Legal entity name and ABN appear on quotes once quoting (Phase 3) ships. Leave blank until confirmed —
        nothing here is pre-filled with placeholder data.
      </p>
      <VenueSettingsForm venueId={ctx.activeVenueId} settings={settings} users={users} />
    </div>
  );
}
