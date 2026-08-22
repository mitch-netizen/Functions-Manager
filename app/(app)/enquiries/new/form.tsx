"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEnquiry } from "@/lib/domain/enquiries/actions";
import type { EventTypeRow } from "@/lib/domain/admin/event-types";
import type { SpaceRow } from "@/lib/domain/admin/spaces";

export function NewEnquiryForm({ eventTypes, spaces }: { eventTypes: EventTypeRow[]; spaces: SpaceRow[] }) {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const result = await createEnquiry({
      contactName: String(formData.get("contactName") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      organisation: String(formData.get("organisation") ?? ""),
      eventTypeId: String(formData.get("eventTypeId") ?? "") || undefined,
      spacePreferenceId: String(formData.get("spacePreferenceId") ?? "") || undefined,
      preferredDate: String(formData.get("preferredDate") ?? ""),
      dateFlexible: formData.get("dateFlexible") === "on",
      headcountEstimate: formData.get("headcountEstimate") ? Number(formData.get("headcountEstimate")) : undefined,
      budgetIndication: formData.get("budgetIndication") ? Number(formData.get("budgetIndication")) : undefined,
      briefDescription: String(formData.get("briefDescription") ?? ""),
      source: (String(formData.get("source") ?? "phone") as "phone" | "email" | "walk_in" | "website" | "social" | "referral" | "repeat"),
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/enquiries/${result.data.id}`);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact name" name="contactName" required autoFocus />
        <Field label="Phone" name="contactPhone" required type="tel" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preferred date" name="preferredDate" type="date" />
        <Field label="Headcount (est.)" name="headcountEstimate" type="number" min={1} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="eventTypeId">
          Event type
        </label>
        <select id="eventTypeId" name="eventTypeId" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm">
          <option value="">— select —</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="source">
          How did this come in?
        </label>
        <select id="source" name="source" defaultValue="phone" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm">
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="walk_in">Walk-in</option>
          <option value="website">Website</option>
          <option value="social">Social</option>
          <option value="referral">Referral</option>
          <option value="repeat">Repeat client</option>
        </select>
      </div>

      <button type="button" onClick={() => setShowMore((v) => !v)} className="text-sm text-neutral-500 underline">
        {showMore ? "Hide" : "Show"} optional details
      </button>

      {showMore && (
        <div className="space-y-3 border-t border-neutral-200 pt-3">
          <Field label="Email" name="contactEmail" type="email" />
          <Field label="Organisation" name="organisation" />
          <Field label="Budget indication" name="budgetIndication" type="number" min={0} step="0.01" />
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="spacePreferenceId">
              Space preference
            </label>
            <select id="spacePreferenceId" name="spacePreferenceId" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm">
              <option value="">— no preference —</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="dateFlexible" /> Date is flexible
          </label>
          <div>
            <label className="block text-sm font-medium text-neutral-700" htmlFor="briefDescription">
              Notes
            </label>
            <textarea
              id="briefDescription"
              name="briefDescription"
              rows={3}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Log enquiry"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoFocus,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
  min?: number;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700" htmlFor={name}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoFocus={autoFocus}
        min={min}
        step={step}
        className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
