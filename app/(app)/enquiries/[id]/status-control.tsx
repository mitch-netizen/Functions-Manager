"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEnquiryStatus } from "@/lib/domain/enquiries/actions";
import type { EnquiryStatus } from "@/lib/types/database.types";
import type { LostReasonRow } from "@/lib/domain/admin/lost-reasons";

const STATUSES: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "qualifying", label: "Qualifying" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "tentative", label: "Tentative" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "lost", label: "Lost" },
  { value: "cancelled", label: "Cancelled" },
];

export function StatusControl({
  enquiryId,
  currentStatus,
  lostReasons,
}: {
  enquiryId: string;
  currentStatus: EnquiryStatus;
  lostReasons: LostReasonRow[];
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<EnquiryStatus>(currentStatus);
  const [reasonId, setReasonId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsReason = nextStatus === "lost" || nextStatus === "cancelled";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nextStatus === currentStatus) return;
    if (needsReason && !reasonId) {
      setError("A reason is required.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateEnquiryStatus({ enquiryId, toStatus: nextStatus, reasonId: reasonId || undefined });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded border border-neutral-200 bg-white p-3">
      <div>
        <label className="block text-xs font-medium text-neutral-500" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as EnquiryStatus)}
          className="mt-1 rounded border border-neutral-300 px-2 py-1 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {needsReason && (
        <div>
          <label className="block text-xs font-medium text-neutral-500" htmlFor="reason">
            Reason
          </label>
          <select
            id="reason"
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-2 py-1 text-sm"
          >
            <option value="">— select —</option>
            {lostReasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          {lostReasons.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">No reasons configured — add some under Admin → Lost reasons.</p>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || nextStatus === currentStatus}
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Update status
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
