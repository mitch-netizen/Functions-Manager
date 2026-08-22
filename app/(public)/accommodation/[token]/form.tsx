"use client";

import { useState } from "react";

export function AccommodationBookingForm({
  token,
  checkInWindowStart,
  checkInWindowEnd,
  nightsAllowed,
}: {
  token: string;
  checkInWindowStart: string;
  checkInWindowEnd: string;
  nightsAllowed: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("token", token);

    const response = await fetch("/api/public-accommodation", { method: "POST", body: formData });
    const result = await response.json();

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong — please try again.");
      return;
    }
    setConfirmed(result.rmsBookingReference ?? "confirmed");
  }

  if (confirmed) {
    return (
      <div className="rounded border border-neutral-200 bg-white p-4 text-sm">
        <p className="font-medium">Your room is booked.</p>
        <p className="mt-1 text-neutral-500">Booking reference: {confirmed}</p>
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

      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="guestName">
          Your name <span className="text-red-500">*</span>
        </label>
        <input id="guestName" name="guestName" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="guestEmail">
          Email
        </label>
        <input id="guestEmail" name="guestEmail" type="email" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="guestPhone">
          Phone
        </label>
        <input id="guestPhone" name="guestPhone" type="tel" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700" htmlFor="checkIn">
            Check-in <span className="text-red-500">*</span>
          </label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            required
            min={checkInWindowStart}
            max={checkInWindowEnd}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700" htmlFor="checkOut">
            Check-out <span className="text-red-500">*</span>
          </label>
          <input id="checkOut" name="checkOut" type="date" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <p className="text-xs text-neutral-400">Up to {nightsAllowed} night{nightsAllowed === 1 ? "" : "s"}.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Booking…" : "Book room"}
      </button>
    </form>
  );
}
