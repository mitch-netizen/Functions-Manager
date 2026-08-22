import { requireSessionContext } from "@/lib/auth/session";
import { listVenueUsers } from "@/lib/domain/admin/venue-users";
import { UsersEditor } from "./editor";

export default async function UsersAdminPage() {
  const ctx = await requireSessionContext();
  const users = await listVenueUsers(ctx.activeVenueId);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold">Users</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Who has access to this venue, and what they can do. Admin: full access. Manager: full access, can&apos;t
        manage users. Coordinator: enquiries and events, not packages/pricing. Viewer: read only.
      </p>
      <UsersEditor users={users} canInvite={ctx.activeRole === "admin"} />
    </div>
  );
}
