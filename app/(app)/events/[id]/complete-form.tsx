"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeEvent } from "@/lib/domain/events/actions";

export function CompleteEventForm({
  eventId,
  enquiryId,
  completedAt,
  actualHeadcount,
  actualSpend,
}: {
  eventId: string;
  enquiryId: string;
  completedAt: string | null;
  actualHeadcount: number | null;
  actualSpend: number | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const result = await completeEvent({
      eventId,
      enquiryId,
      actualHeadcount: Number(formData.get("actualHeadcount") ?? 0),
      actualSpend: Number(formData.get("actualSpend") ?? 0),
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (completedAt) {
    return (
      <div className="rounded border border-neutral-200 bg-white p-3 text-sm">
        <h2 className="mb-2 font-semibold text-neutral-700">Completed</h2>
        <p>Actual headcount: {actualHeadcount}</p>
        <p>Actual spend: ${actualSpend?.toFixed(2)}</p>
        <p className="mt-1 text-xs text-neutral-400">{new Date(completedAt).toLocaleString()}</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-2 rounded border border-neutral-200 bg-white p-3">
      <h2 className="text-sm font-semibold text-neutral-700">Complete event</h2>
      <p className="text-xs text-neutral-500">
        Actual headcount and spend are required to mark this event complete — this is what makes forecasting
        useful later.
      </p>
      <input name="actualHeadcount" type="number" min={1} required placeholder="Actual headcount" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
      <input name="actualSpend" type="number" min={0} step="0.01" required placeholder="Actual spend ($)" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
        Mark complete
      </button>
    </form>
  );
}
