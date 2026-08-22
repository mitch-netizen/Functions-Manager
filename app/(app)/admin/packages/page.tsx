import { requireSessionContext } from "@/lib/auth/session";
import { listPackages } from "@/lib/domain/admin/packages";
import { PackagesEditor } from "./editor";

export default async function PackagesAdminPage() {
  const ctx = await requireSessionContext();
  const packages = await listPackages(ctx.activeVenueId, true);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Packages</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Used to build quotes. Each venue configures its own pricing and inclusions — nothing here is shared
        across venues.
      </p>
      {packages.length === 0 && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Nothing configured yet — add your venue&apos;s packages below before building quotes.
        </p>
      )}
      <PackagesEditor packages={packages} />
    </div>
  );
}
