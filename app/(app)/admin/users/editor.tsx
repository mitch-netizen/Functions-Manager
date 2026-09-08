"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteVenueUser, updateVenueUserRole, removeVenueUser } from "@/lib/domain/admin/venue-users";
import type { VenueUserRow } from "@/lib/domain/admin/venue-users";
import type { VenueRole } from "@/lib/types/database.types";

const ROLES: VenueRole[] = ["admin", "functions_manager", "duty_manager", "kitchen", "executive_readonly"];

export function UsersEditor({ users, canInvite }: { users: VenueUserRow[]; canInvite: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const role = formData.get("role") as VenueRole;
    if (!email) return;
    setPending(true);
    setError(null);
    const result = await inviteVenueUser({ email, role });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("invite-email") as HTMLInputElement).value = "";
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
        {users.map((u) => (
          <li key={u.membershipId} className="flex items-center justify-between px-3 py-2 text-sm">
            <div>
              <div className="font-medium">{u.fullName ?? u.email}</div>
              <div className="text-xs text-neutral-400">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                defaultValue={u.role}
                onChange={async (e) => {
                  await updateVenueUserRole(u.membershipId, e.target.value as VenueRole);
                  router.refresh();
                }}
                className="rounded border border-neutral-300 px-2 py-1 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  await removeVenueUser(u.membershipId);
                  router.refresh();
                }}
                className="text-xs text-red-600 underline"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {users.length === 0 && <li className="px-3 py-2 text-sm text-neutral-400">Nobody has access yet.</li>}
      </ul>

      {canInvite && (
        <form action={handleInvite} className="flex flex-wrap gap-2">
          <input
            id="invite-email"
            name="email"
            type="email"
            placeholder="email@example.com"
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
          />
          <select name="role" defaultValue="duty_manager" className="rounded border border-neutral-300 px-2 py-1 text-sm">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
            Invite
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
