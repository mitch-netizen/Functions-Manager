"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRmsSettings } from "@/lib/domain/admin/rms-settings";
import type { RmsSettings } from "@/lib/domain/admin/rms-settings";

export function RmsSettingsForm({ settings }: { settings: RmsSettings }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await updateRmsSettings({
      agentId: String(formData.get("agentId") ?? ""),
      clientId: String(formData.get("clientId") ?? ""),
      apiKey: String(formData.get("apiKey") ?? ""),
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
    <div className="mt-8 max-w-md space-y-2 border-t border-neutral-200 pt-6">
      <h2 className="text-sm font-semibold text-neutral-700">Accommodation (RMS)</h2>
      <p className="mb-2 text-xs text-neutral-500">
        Lets guests self-book a room against a staff-created block once a function is confirmed. Credentials are
        never shown again once saved.
      </p>
      <form action={handleSubmit} className="space-y-2">
        <input
          name="agentId"
          defaultValue={settings.agentId}
          placeholder="RMS Agent ID"
          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <input
          name="clientId"
          defaultValue={settings.clientId}
          placeholder="RMS Client ID"
          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <input
          name="apiKey"
          type="password"
          placeholder={settings.apiKeySet ? "API key on file — leave blank to keep it" : "RMS API key"}
          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          Save
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
    </div>
  );
}
