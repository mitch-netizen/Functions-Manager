"use client";

import { useState } from "react";
import { updateVenueGeneralSettings } from "@/lib/domain/admin/venue-settings";
import type { VenueGeneralSettings } from "@/lib/domain/admin/venue-settings";
import type { VenueUserRow } from "@/lib/domain/admin/venue-users";

export function VenueSettingsForm({
  venueId,
  settings,
  users,
}: {
  venueId: string;
  settings: VenueGeneralSettings;
  users: VenueUserRow[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await updateVenueGeneralSettings({
      venueId,
      name: String(formData.get("name") ?? ""),
      tradingName: String(formData.get("tradingName") ?? ""),
      address: String(formData.get("address") ?? ""),
      abn: String(formData.get("abn") ?? ""),
      timezone: String(formData.get("timezone") ?? "Australia/Brisbane"),
      legalEntityName: String(formData.get("legalEntityName") ?? ""),
      defaultOwnerUserId: String(formData.get("defaultOwnerUserId") ?? "") || undefined,
      gstRate: Number(formData.get("gstRatePercent") ?? 10) / 100,
      privacyNoticeUrl: String(formData.get("privacyNoticeUrl") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-3">
      <Field label="Venue name" name="name" defaultValue={settings.name} required />
      <Field label="Trading name" name="tradingName" defaultValue={settings.tradingName ?? ""} />
      <Field label="Address" name="address" defaultValue={settings.address ?? ""} />
      <Field label="ABN" name="abn" defaultValue={settings.abn ?? ""} placeholder="Not yet confirmed" />
      <Field label="Timezone" name="timezone" defaultValue={settings.timezone} />
      <Field
        label="Legal entity name (for quotes)"
        name="legalEntityName"
        defaultValue={settings.legalEntityName ?? ""}
        placeholder="Not yet confirmed"
      />
      <Field label="GST rate (%)" name="gstRatePercent" defaultValue={String(settings.gstRate * 100)} />
      <Field
        label="Privacy notice URL"
        name="privacyNoticeUrl"
        defaultValue={settings.privacyNoticeUrl ?? ""}
        placeholder="https://…"
      />
      <div>
        <label className="block text-sm font-medium text-neutral-700" htmlFor="defaultOwnerUserId">
          Default enquiry owner
        </label>
        <select
          id="defaultOwnerUserId"
          name="defaultOwnerUserId"
          defaultValue={settings.defaultOwnerUserId ?? ""}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">— none —</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.fullName ?? u.email}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        Save
      </button>

      <div className="border-t border-neutral-200 pt-3">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700">Public enquiry form</h2>
        <p className="mb-2 text-xs text-neutral-500">Embed this on queensgladstone.au, or link to it directly.</p>
        <EmbedSnippet slug={settings.slug} />
      </div>
    </form>
  );
}

function EmbedSnippet({ slug }: { slug: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/enquire/${slug}`;
  return (
    <pre className="overflow-x-auto rounded bg-neutral-900 p-2 text-xs text-neutral-100">
      {`<iframe src="${url}" width="100%" height="700" frameborder="0"></iframe>`}
    </pre>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
