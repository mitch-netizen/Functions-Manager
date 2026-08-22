"use client";

import { useRef } from "react";
import { switchVenue } from "./actions";

export function VenueSwitcher({ memberships, activeVenueId }: { memberships: { venueId: string; venueName: string }[]; activeVenueId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchVenue} className="flex items-center gap-2">
      <select
        name="venueId"
        defaultValue={activeVenueId}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded border border-neutral-300 px-2 py-1 text-sm"
      >
        {memberships.map((m) => (
          <option key={m.venueId} value={m.venueId}>
            {m.venueName}
          </option>
        ))}
      </select>
    </form>
  );
}
