import { requireSessionContext } from "@/lib/auth/session";
import { getVenueGeneralSettings } from "@/lib/domain/admin/venue-settings";
import { listVenueUsers } from "@/lib/domain/admin/venue-users";
import { getBrandConfig, getTermsAndConditions } from "@/lib/domain/admin/branding";
import { getAutomationSettings } from "@/lib/domain/admin/automation-settings";
import { getRmsSettings } from "@/lib/domain/admin/rms-settings";
import { VenueSettingsForm } from "./form";
import { BrandAndDocumentsForm } from "./brand-form";
import { AutomationSettingsForm } from "./automation-form";
import { RmsSettingsForm } from "./rms-form";

export default async function VenueSettingsAdminPage() {
  const ctx = await requireSessionContext();
  const [settings, users, brand, terms, automation, rms] = await Promise.all([
    getVenueGeneralSettings(ctx.activeVenueId),
    listVenueUsers(ctx.activeVenueId),
    getBrandConfig(ctx.activeVenueId),
    getTermsAndConditions(ctx.activeVenueId),
    getAutomationSettings(ctx.activeVenueId),
    getRmsSettings(ctx.activeVenueId),
  ]);

  if (!settings) return <p className="text-sm text-neutral-500">Venue not found.</p>;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Venue settings</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Legal entity name and ABN appear on quotes. Leave blank until confirmed — nothing here is pre-filled with
        placeholder data.
      </p>
      <VenueSettingsForm venueId={ctx.activeVenueId} settings={settings} users={users} />
      <BrandAndDocumentsForm brand={brand} terms={terms} />
      <AutomationSettingsForm venueId={ctx.activeVenueId} settings={automation} />
      <RmsSettingsForm settings={rms} />
    </div>
  );
}
