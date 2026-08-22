"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHold, releaseHold } from "@/lib/domain/holds/actions";
import type { EnquiryHold } from "@/lib/domain/holds/queries";
import type { SpaceRow } from "@/lib/domain/admin/spaces";

export function HoldsPanel({ enquiryId, spaces, holds }: { enquiryId: string; spaces: SpaceRow[]; holds: EnquiryHold[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setWarnings([]);

    const startsAtLocal = String(formData.get("startsAt") ?? "");
    const endsAtLocal = String(formData.get("endsAt") ?? "");
    if (!startsAtLocal || !endsAtLocal) {
      setPending(false);
      setError("Start and end are required.");
      return;
    }

    const result = await createHold({
      enquiryId,
      spaceId: String(formData.get("spaceId") ?? ""),
      startsAt: new Date(startsAtLocal).toISOString(),
      endsAt: new Date(endsAtLocal).toISOString(),
      holdType: formData.get("holdType") === "confirmed" ? "confirmed" : "tentative",
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.conflictWarnings.length > 0) setWarnings(result.data.conflictWarnings);
    router.refresh();
  }

  async function handleRelease(holdId: string) {
    await releaseHold(holdId, enquiryId);
    router.refresh();
  }

  return (
    <div className="rounded border border-neutral-200 bg-white p-3">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Holds</h2>
      <ul className="mb-3 space-y-2 text-sm">
        {holds.map((h) => (
          <li key={h.holdId} className="flex items-center justify-between">
            <div>
              <span className={h.holdType === "confirmed" ? "font-medium" : "italic text-neutral-500"}>{h.spaceName}</span>
              <div className="text-xs text-neutral-400">
                {new Date(h.startsAt).toLocaleString()} – {new Date(h.endsAt).toLocaleString()}
                {h.holdType === "tentative" && h.expiresAt && ` · expires ${new Date(h.expiresAt).toLocaleDateString()}`}
              </div>
            </div>
            <button onClick={() => handleRelease(h.holdId)} className="text-xs text-red-600 underline">
              Release
            </button>
          </li>
        ))}
        {holds.length === 0 && <li className="text-neutral-400">No holds placed.</li>}
      </ul>

      {spaces.length === 0 ? (
        <p className="text-xs text-amber-700">No spaces configured — add some under Admin → Spaces.</p>
      ) : (
        <form action={handleSubmit} className="space-y-2">
          <select name="spaceId" required className="w-full rounded border border-neutral-300 px-2 py-1 text-sm">
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="startsAt" type="datetime-local" required className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="endsAt" type="datetime-local" required className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          </div>
          <select name="holdType" defaultValue="tentative" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm">
            <option value="tentative">Tentative</option>
            <option value="confirmed">Confirmed</option>
          </select>
          <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            Place hold
          </button>
        </form>
      )}

      {warnings.length > 0 && (
        <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
          Conflicts (not blocked): {warnings.join("; ")}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
