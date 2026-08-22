"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLostReason, setLostReasonActive } from "@/lib/domain/admin/lost-reasons";
import type { LostReasonRow } from "@/lib/domain/admin/lost-reasons";

export function LostReasonsEditor({ lostReasons }: { lostReasons: LostReasonRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const label = String(formData.get("label") ?? "").trim();
    if (!label) return;
    setPending(true);
    setError(null);
    const result = await createLostReason({ label, displayOrder: lostReasons.length });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("lost-reason-label") as HTMLInputElement).value = "";
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
        {lostReasons.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className={r.active ? "" : "text-neutral-400 line-through"}>{r.label}</span>
            <button
              onClick={async () => {
                await setLostReasonActive(r.id, !r.active);
                router.refresh();
              }}
              className="text-xs text-neutral-500 underline"
            >
              {r.active ? "Deactivate" : "Reactivate"}
            </button>
          </li>
        ))}
        {lostReasons.length === 0 && <li className="px-3 py-2 text-sm text-neutral-400">None yet.</li>}
      </ul>
      <form action={handleAdd} className="flex gap-2">
        <input id="lost-reason-label" name="label" placeholder="e.g. Went with another venue, Budget…" className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm" />
        <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
