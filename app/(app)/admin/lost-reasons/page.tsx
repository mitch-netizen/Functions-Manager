import { requireSessionContext } from "@/lib/auth/session";
import { listLostReasons } from "@/lib/domain/admin/lost-reasons";
import { LostReasonsEditor } from "./editor";

export default async function LostReasonsAdminPage() {
  const ctx = await requireSessionContext();
  const lostReasons = await listLostReasons(ctx.activeVenueId, true);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Lost reasons</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Required whenever an enquiry is marked lost or cancelled. Each venue configures its own list.
      </p>
      {lostReasons.length === 0 && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Nothing configured yet — enquiries can&apos;t be marked lost/cancelled until at least one reason exists.
        </p>
      )}
      <LostReasonsEditor lostReasons={lostReasons} />
    </div>
  );
}
