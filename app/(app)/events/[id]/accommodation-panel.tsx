"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccommodationBlock } from "@/lib/domain/accommodation/actions";
import type { AccommodationBlock } from "@/lib/domain/accommodation/queries";

export function AccommodationPanel({ eventId, blocks }: { eventId: string; blocks: AccommodationBlock[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setPending(true);
    setError(null);

    const result = await createAccommodationBlock({
      eventId,
      roomTypeCode: String(formData.get("roomTypeCode") ?? ""),
      roomsHeld: Number(formData.get("roomsHeld") ?? 0),
      checkInWindowStart: String(formData.get("checkInWindowStart") ?? ""),
      checkInWindowEnd: String(formData.get("checkInWindowEnd") ?? ""),
      nightsAllowed: Number(formData.get("nightsAllowed") ?? 1),
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("accommodation-block-form") as HTMLFormElement).reset();
    router.refresh();
  }

  function guestLink(token: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return `${base}/accommodation/${token}`;
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(guestLink(token)).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  return (
    <div className="rounded border border-neutral-200 bg-white p-3">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Accommodation</h2>

      <ul className="mb-3 space-y-2 text-sm">
        {blocks.map((b) => (
          <li key={b.id} className="rounded border border-neutral-100 p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{b.roomTypeCode}</span>
              <span className="text-neutral-500">
                {b.roomsBooked} / {b.roomsHeld} booked
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-500">
              {b.checkInWindowStart} – {b.checkInWindowEnd} · up to {b.nightsAllowed} night{b.nightsAllowed === 1 ? "" : "s"} ·{" "}
              {b.status}
            </div>
            {b.status === "active" && (
              <button onClick={() => copyLink(b.publicToken)} className="mt-1 text-xs text-blue-600 underline">
                {copiedToken === b.publicToken ? "Copied!" : "Copy guest booking link"}
              </button>
            )}
          </li>
        ))}
        {blocks.length === 0 && <li className="text-neutral-400">No room blocks yet.</li>}
      </ul>

      <form id="accommodation-block-form" action={handleCreate} className="space-y-2">
        <input name="roomTypeCode" placeholder="RMS room type code" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input name="roomsHeld" type="number" min={1} placeholder="Rooms held" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <input name="nightsAllowed" type="number" min={1} defaultValue={1} placeholder="Max nights" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="checkInWindowStart" type="date" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <input name="checkInWindowEnd" type="date" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
        </div>
        <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          Create room block
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
