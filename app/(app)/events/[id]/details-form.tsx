"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEventDetails } from "@/lib/domain/events/actions";
import type { EventDetail } from "@/lib/domain/events/queries";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDetailsForm({ event }: { event: EventDetail }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSaved(false);

    const result = await updateEventDetails({
      eventId: event.id,
      bumpInAt: String(formData.get("bumpInAt") ?? "") || undefined,
      bumpOutAt: String(formData.get("bumpOutAt") ?? "") || undefined,
      roomSetup: String(formData.get("roomSetup") ?? ""),
      avRequirements: String(formData.get("avRequirements") ?? ""),
      specialInstructions: String(formData.get("specialInstructions") ?? ""),
      runSheetNotes: String(formData.get("runSheetNotes") ?? ""),
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded border border-neutral-200 bg-white p-3">
      <h2 className="text-sm font-semibold text-neutral-700">Operational details</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bump-in" name="bumpInAt" type="datetime-local" defaultValue={toLocalInputValue(event.bumpInAt)} />
        <Field label="Bump-out" name="bumpOutAt" type="datetime-local" defaultValue={toLocalInputValue(event.bumpOutAt)} />
      </div>
      <Textarea label="Room setup" name="roomSetup" defaultValue={event.roomSetup ?? ""} />
      <Textarea label="AV requirements" name="avRequirements" defaultValue={event.avRequirements ?? ""} />
      <Textarea label="Special instructions" name="specialInstructions" defaultValue={event.specialInstructions ?? ""} />
      <Textarea label="Run sheet notes" name="runSheetNotes" defaultValue={event.runSheetNotes ?? ""} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
        Save details
      </button>
    </form>
  );
}

function Field({ label, name, type, defaultValue }: { label: string; name: string; type: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
    </div>
  );
}

function Textarea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} defaultValue={defaultValue} rows={2} className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
    </div>
  );
}
