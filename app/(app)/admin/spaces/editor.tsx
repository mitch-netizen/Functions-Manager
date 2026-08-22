"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertSpace, setSpaceActive } from "@/lib/domain/admin/spaces";
import type { SpaceRow } from "@/lib/domain/admin/spaces";

export function SpacesEditor({ spaces }: { spaces: SpaceRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    setPending(true);
    setError(null);

    const result = await upsertSpace({
      name,
      capacitySeated: formData.get("capacitySeated") ? Number(formData.get("capacitySeated")) : undefined,
      capacityStanding: formData.get("capacityStanding") ? Number(formData.get("capacityStanding")) : undefined,
      capacityCocktail: formData.get("capacityCocktail") ? Number(formData.get("capacityCocktail")) : undefined,
      minimumSpend: formData.get("minimumSpend") ? Number(formData.get("minimumSpend")) : undefined,
      notes: String(formData.get("notes") ?? ""),
      displayOrder: spaces.length,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("space-form") as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
        {spaces.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <div className={s.active ? "" : "text-neutral-400 line-through"}>
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-neutral-400">
                {[
                  s.capacitySeated ? `${s.capacitySeated} seated` : null,
                  s.capacityStanding ? `${s.capacityStanding} standing` : null,
                  s.capacityCocktail ? `${s.capacityCocktail} cocktail` : null,
                  s.minimumSpend ? `$${s.minimumSpend} min spend` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <button
              onClick={async () => {
                await setSpaceActive(s.id, !s.active);
                router.refresh();
              }}
              className="text-xs text-neutral-500 underline"
            >
              {s.active ? "Deactivate" : "Reactivate"}
            </button>
          </li>
        ))}
        {spaces.length === 0 && <li className="px-3 py-2 text-sm text-neutral-400">None yet.</li>}
      </ul>

      <form id="space-form" action={handleAdd} className="space-y-2 rounded border border-neutral-200 bg-white p-3">
        <input name="name" placeholder="Space name" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <input name="capacitySeated" type="number" min={0} placeholder="Seated cap." className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <input name="capacityStanding" type="number" min={0} placeholder="Standing cap." className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <input name="capacityCocktail" type="number" min={0} placeholder="Cocktail cap." className="rounded border border-neutral-300 px-2 py-1 text-sm" />
        </div>
        <input name="minimumSpend" type="number" min={0} step="0.01" placeholder="Minimum spend ($)" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <textarea name="notes" placeholder="Notes" rows={2} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          Add space
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
