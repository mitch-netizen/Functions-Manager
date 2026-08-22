"use client";

import { useState } from "react";

export function PublicEnquiryForm({
  venueSlug,
  eventTypes,
  privacyNoticeUrl,
}: {
  venueSlug: string;
  eventTypes: { id: string; name: string }[];
  privacyNoticeUrl: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("venueSlug", venueSlug);

    const response = await fetch("/api/public-enquiry", { method: "POST", body: formData });
    const result = await response.json();

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong — please try again.");
      return;
    }
    setReferenceNumber(result.referenceNumber ?? "received");
  }

  if (referenceNumber) {
    return (
      <div className="rounded border border-neutral-200 bg-white p-4 text-sm">
        <p className="font-medium">Thanks — we&apos;ve got your enquiry.</p>
        <p className="mt-1 text-neutral-500">Someone from our team will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {/* Honeypot: real visitors never see or fill this in. */}
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <Field label="Your name" name="contactName" required />
      <Field label="Phone" name="contactPhone" type="tel" required />
      <Field label="Email" name="contactEmail" type="email" />
      <Field label="Preferred date" name="preferredDate" type="date" />
      <Field label="Estimated headcount" name="headcountEstimate" type="number" min={1} />

      {eventTypes.length > 0 && (
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
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="briefDescription">
          Tell us about your event
        </label>
        <textarea id="briefDescription" name="briefDescription" rows={3} className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Sending…" : "Send enquiry"}
      </button>

      {privacyNoticeUrl && (
        <p className="text-center text-xs text-neutral-400">
          <a href={privacyNoticeUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Privacy notice
          </a>
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: number;
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
        min={min}
        className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
