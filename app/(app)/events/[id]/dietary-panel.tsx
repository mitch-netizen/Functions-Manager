"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDietaryRequirement, removeDietaryRequirement } from "@/lib/domain/events/actions";
import type { DietaryRequirement } from "@/lib/domain/events/queries";

export function DietaryPanel({ eventId, dietaryRequirements }: { eventId: string; dietaryRequirements: DietaryRequirement[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const requirement = String(formData.get("requirement") ?? "").trim();
    if (!requirement) return;
    setPending(true);
    setError(null);

    const result = await addDietaryRequirement({
      eventId,
      requirement,
      headcount: Number(formData.get("headcount") ?? 1),
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("dietary-form") as HTMLFormElement).reset();
    router.refresh();
  }

  async function handleRemove(id: string) {
    await removeDietaryRequirement(id, eventId);
    router.refresh();
  }

  return (
    <div className="rounded border border-neutral-200 bg-white p-3">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Dietary requirements</h2>
      <ul className="mb-3 space-y-1 text-sm">
        {dietaryRequirements.map((d) => (
          <li key={d.id} className="flex items-center justify-between">
            <span>
              {d.requirement} × {d.headcount}
            </span>
            <button onClick={() => handleRemove(d.id)} className="text-xs text-red-600 underline">
              Remove
            </button>
          </li>
        ))}
        {dietaryRequirements.length === 0 && <li className="text-neutral-400">None recorded.</li>}
      </ul>
      <form id="dietary-form" action={handleAdd} className="flex gap-2">
        <input name="requirement" placeholder="e.g. Vegetarian, Gluten-free" className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm" />
        <input name="headcount" type="number" min={1} defaultValue={1} className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm" />
        <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
