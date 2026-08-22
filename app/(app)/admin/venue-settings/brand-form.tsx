"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBrandConfig, uploadTermsAndConditions } from "@/lib/domain/admin/branding";
import type { BrandConfigFields, TermsAndConditionsInfo } from "@/lib/domain/admin/branding";

export function BrandAndDocumentsForm({ brand, terms }: { brand: BrandConfigFields; terms: TermsAndConditionsInfo | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleBrandSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSaved(false);
    const result = await updateBrandConfig({
      headingFont: String(formData.get("headingFont") ?? ""),
      bodyFont: String(formData.get("bodyFont") ?? ""),
      goldColor: String(formData.get("goldColor") ?? ""),
      blackColor: String(formData.get("blackColor") ?? ""),
      charcoalColor: String(formData.get("charcoalColor") ?? ""),
      panelColor: String(formData.get("panelColor") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handleUpload(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await uploadTermsAndConditions(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 max-w-md space-y-6 border-t border-neutral-200 pt-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Brand</h2>
        <p className="mb-2 text-xs text-neutral-500">
          Used on the proposal PDF, run sheet, and outbound emails — restrained in the app itself, per the brief.
        </p>
        <form action={handleBrandSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input name="headingFont" defaultValue={brand.headingFont} placeholder="Heading font" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="bodyFont" defaultValue={brand.bodyFont} placeholder="Body font" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <input name="goldColor" defaultValue={brand.goldColor} placeholder="Gold #" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="blackColor" defaultValue={brand.blackColor} placeholder="Black #" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="charcoalColor" defaultValue={brand.charcoalColor} placeholder="Charcoal #" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="panelColor" defaultValue={brand.panelColor} placeholder="Panel #" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          </div>
          <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            Save brand
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Terms & conditions</h2>
        <p className="mb-2 text-xs text-neutral-500">
          {terms ? `Current: ${terms.filename}` : "Not yet uploaded — proposals will note it isn't confirmed."}
        </p>
        <form action={handleUpload} className="flex items-center gap-2">
          <input name="file" type="file" accept="application/pdf" className="text-sm" />
          <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            Upload
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
    </div>
  );
}
