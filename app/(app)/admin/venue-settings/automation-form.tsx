"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAutomationSettings } from "@/lib/domain/admin/automation-settings";
import type { AutomationSettings } from "@/lib/domain/admin/automation-settings";

const FIELDS: { key: keyof AutomationSettings; label: string }[] = [
  { key: "defaultTentativeHoldDays", label: "Tentative hold expires after (days)" },
  { key: "defaultFollowupNewEnquiryBusinessDays", label: "Follow up on new enquiry after (business days)" },
  { key: "defaultFollowupProposalSentBusinessDays", label: "Follow up after proposal sent (business days)" },
  { key: "staleEnquiryDays", label: "Flag enquiry as stale after (days, no activity)" },
  { key: "holdExpiryWarningDays", label: "Warn before tentative hold expires (days)" },
  { key: "finalDetailsDaysBeforeEvent", label: "Task for final details due (days before event)" },
  { key: "finalNumbersDaysBeforeEvent", label: "Task to confirm final numbers (days before event)" },
];

export function AutomationSettingsForm({ venueId, settings }: { venueId: string; settings: AutomationSettings }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSaved(false);

    const result = await updateAutomationSettings(venueId, {
      defaultTentativeHoldDays: Number(formData.get("defaultTentativeHoldDays")),
      defaultFollowupNewEnquiryBusinessDays: Number(formData.get("defaultFollowupNewEnquiryBusinessDays")),
      defaultFollowupProposalSentBusinessDays: Number(formData.get("defaultFollowupProposalSentBusinessDays")),
      staleEnquiryDays: Number(formData.get("staleEnquiryDays")),
      holdExpiryWarningDays: Number(formData.get("holdExpiryWarningDays")),
      finalDetailsDaysBeforeEvent: Number(formData.get("finalDetailsDaysBeforeEvent")),
      finalNumbersDaysBeforeEvent: Number(formData.get("finalNumbersDaysBeforeEvent")),
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
    <div className="mt-8 max-w-md border-t border-neutral-200 pt-6">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Automation timings</h2>
      <p className="mb-3 text-xs text-neutral-500">Every automated follow-up task and reminder uses these venue-specific defaults.</p>
      <form action={handleSubmit} className="space-y-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-2">
            <label className="text-sm text-neutral-700" htmlFor={f.key}>
              {f.label}
            </label>
            <input
              id={f.key}
              name={f.key}
              type="number"
              min={1}
              defaultValue={settings[f.key]}
              className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </div>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">Saved.</p>}
        <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          Save
        </button>
      </form>
    </div>
  );
}
