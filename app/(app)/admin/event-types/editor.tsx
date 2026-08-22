"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventType, setEventTypeActive } from "@/lib/domain/admin/event-types";
import type { EventTypeRow } from "@/lib/domain/admin/event-types";

export function EventTypesEditor({ eventTypes }: { eventTypes: EventTypeRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    setPending(true);
    setError(null);
    const result = await createEventType({ name, displayOrder: eventTypes.length });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("event-type-name") as HTMLInputElement).value = "";
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
        {eventTypes.map((et) => (
          <li key={et.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className={et.active ? "" : "text-neutral-400 line-through"}>{et.name}</span>
            <button
              onClick={async () => {
                await setEventTypeActive(et.id, !et.active);
                router.refresh();
              }}
              className="text-xs text-neutral-500 underline"
            >
              {et.active ? "Deactivate" : "Reactivate"}
            </button>
          </li>
        ))}
        {eventTypes.length === 0 && <li className="px-3 py-2 text-sm text-neutral-400">None yet.</li>}
      </ul>
      <form action={handleAdd} className="flex gap-2">
        <input id="event-type-name" name="name" placeholder="e.g. Wedding, Corporate, Wake…" className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm" />
        <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
