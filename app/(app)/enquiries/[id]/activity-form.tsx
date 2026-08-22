"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addActivity } from "@/lib/domain/enquiries/actions";

const TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email_sent", label: "Email sent" },
  { value: "email_received", label: "Email received" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site visit" },
] as const;

export function ActivityForm({ enquiryId }: { enquiryId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    setPending(true);
    setError(null);
    const result = await addActivity({
      enquiryId,
      type: formData.get("type") as (typeof TYPES)[number]["value"],
      body,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("activity-body") as HTMLTextAreaElement).value = "";
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <select name="type" defaultValue="note" className="rounded border border-neutral-300 px-2 py-1 text-sm">
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <textarea
        id="activity-body"
        name="body"
        rows={1}
        placeholder="Add a note…"
        className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
      />
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
        Add
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
