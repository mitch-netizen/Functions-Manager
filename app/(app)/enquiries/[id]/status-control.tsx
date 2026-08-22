"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEnquiryStatus } from "@/lib/domain/enquiries/actions";
import { confirmEnquiry } from "@/lib/domain/events/actions";
import type { EnquiryStatus } from "@/lib/types/database.types";
import type { LostReasonRow } from "@/lib/domain/admin/lost-reasons";
import type { SpaceRow } from "@/lib/domain/admin/spaces";

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
  spaces,
}: {
  enquiryId: string;
  currentStatus: EnquiryStatus;
  lostReasons: LostReasonRow[];
  spaces: SpaceRow[];
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<EnquiryStatus>(currentStatus);
  const [reasonId, setReasonId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsReason = nextStatus === "lost" || nextStatus === "cancelled";
  const needsConfirmationDetails = nextStatus === "confirmed" && currentStatus !== "confirmed";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nextStatus === currentStatus) return;
    if (needsReason && !reasonId) {
      setError("A reason is required.");
      return;
    }

    setPending(true);
    setError(null);

    if (needsConfirmationDetails) {
      const form = e.currentTarget as HTMLFormElement;
      const spaceIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="confirmSpaceId"]:checked')).map((el) => el.value);
      const startsAt = (form.elements.namedItem("confirmedStartsAt") as HTMLInputElement)?.value;
      const endsAt = (form.elements.namedItem("confirmedEndsAt") as HTMLInputElement)?.value;
      const headcount = (form.elements.namedItem("finalHeadcount") as HTMLInputElement)?.value;

      if (spaceIds.length === 0 || !startsAt || !endsAt) {
        setPending(false);
        setError("Select at least one space and confirmed start/end times.");
        return;
      }

      const result = await confirmEnquiry({
        enquiryId,
        confirmedStartsAt: new Date(startsAt).toISOString(),
        confirmedEndsAt: new Date(endsAt).toISOString(),
        spaceIds,
        finalHeadcount: headcount ? Number(headcount) : undefined,
      });
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/events/${result.data.eventId}`);
      return;
    }

    const result = await updateEnquiryStatus({ enquiryId, toStatus: nextStatus, reasonId: reasonId || undefined });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-neutral-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-2">
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
      </div>

      {needsConfirmationDetails && (
        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <p className="text-xs font-medium text-neutral-500">Confirmation details</p>
          <div className="flex flex-wrap gap-2">
            {spaces.map((s) => (
              <label key={s.id} className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs">
                <input type="checkbox" name="confirmSpaceId" value={s.id} />
                {s.name}
              </label>
            ))}
            {spaces.length === 0 && <p className="text-xs text-amber-700">No spaces configured — add some under Admin → Spaces.</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="confirmedStartsAt" type="datetime-local" required className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="confirmedEndsAt" type="datetime-local" required className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="finalHeadcount" type="number" min={1} placeholder="Final headcount" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
