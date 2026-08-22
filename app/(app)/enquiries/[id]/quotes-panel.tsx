"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuoteDraft, addLineItem, removeLineItem, sendQuote, reviseQuote } from "@/lib/domain/quotes/actions";
import type { QuoteSummary, QuoteDetail } from "@/lib/domain/quotes/queries";
import type { PackageRow } from "@/lib/domain/admin/packages";

export function QuotesPanel({
  enquiryId,
  quotes,
  draftDetail,
  packages,
}: {
  enquiryId: string;
  quotes: QuoteSummary[];
  draftDetail: QuoteDetail | null;
  packages: PackageRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = quotes[0];

  async function handleCreateDraft() {
    setPending(true);
    setError(null);
    const result = await createQuoteDraft(enquiryId);
    setPending(false);
    if (!result.ok) setError(result.error);
    router.refresh();
  }

  async function handleAddPackageLine(formData: FormData) {
    if (!draftDetail) return;
    setPending(true);
    setError(null);
    const result = await addLineItem({
      quoteId: draftDetail.id,
      enquiryId,
      packageId: String(formData.get("packageId") ?? "") || undefined,
      quantity: Number(formData.get("quantity") ?? 1),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleAddAdhocLine(formData: FormData) {
    if (!draftDetail) return;
    const description = String(formData.get("description") ?? "").trim();
    if (!description) return;
    setPending(true);
    setError(null);
    const result = await addLineItem({
      quoteId: draftDetail.id,
      enquiryId,
      description,
      quantity: Number(formData.get("adhocQuantity") ?? 1),
      unitPrice: Number(formData.get("unitPrice") ?? 0),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("adhoc-form") as HTMLFormElement).reset();
    router.refresh();
  }

  async function handleRemoveLine(lineItemId: string) {
    if (!draftDetail) return;
    await removeLineItem(lineItemId, draftDetail.id, enquiryId);
    router.refresh();
  }

  async function handleSend() {
    if (!draftDetail) return;
    setPending(true);
    setError(null);
    const result = await sendQuote(draftDetail.id);
    setPending(false);
    if (!result.ok) setError(result.error);
    router.refresh();
  }

  async function handleRevise() {
    setPending(true);
    setError(null);
    const result = await reviseQuote(latest.id);
    setPending(false);
    if (!result.ok) setError(result.error);
    router.refresh();
  }

  return (
    <div className="rounded border border-neutral-200 bg-white p-3">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Quotes</h2>

      {quotes.length === 0 && (
        <button onClick={handleCreateDraft} disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          Start a quote
        </button>
      )}

      {draftDetail && (
        <div className="space-y-3">
          <ul className="divide-y divide-neutral-100 text-sm">
            {draftDetail.lineItems.map((li) => (
              <li key={li.id} className="flex items-center justify-between py-1">
                <span>
                  {li.description} × {li.quantity}
                </span>
                <div className="flex items-center gap-2">
                  <span>${li.lineTotal.toFixed(2)}</span>
                  <button onClick={() => handleRemoveLine(li.id)} className="text-xs text-red-600 underline">
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {draftDetail.lineItems.length === 0 && <li className="py-1 text-neutral-400">No line items yet.</li>}
          </ul>

          {packages.length > 0 && (
            <form action={handleAddPackageLine} className="flex gap-2">
              <select name="packageId" className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm">
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.perHeadPrice ? `($${p.perHeadPrice}/head)` : ""}
                  </option>
                ))}
              </select>
              <input name="quantity" type="number" min={1} defaultValue={1} className="w-16 rounded border border-neutral-300 px-2 py-1 text-sm" />
              <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
                Add
              </button>
            </form>
          )}

          <form id="adhoc-form" action={handleAddAdhocLine} className="flex gap-2">
            <input name="description" placeholder="Ad hoc line description" className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="adhocQuantity" type="number" min={1} defaultValue={1} className="w-14 rounded border border-neutral-300 px-2 py-1 text-sm" />
            <input name="unitPrice" type="number" min={0} step="0.01" placeholder="$" className="w-20 rounded border border-neutral-300 px-2 py-1 text-sm" />
            <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50">
              Add
            </button>
          </form>

          <div className="rounded bg-neutral-50 p-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${draftDetail.subtotal.toFixed(2)}</span>
            </div>
            {draftDetail.minimumSpendApplied != null && (
              <div className="flex justify-between text-amber-700">
                <span>Minimum spend applied</span>
                <span>${draftDetail.minimumSpendApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST</span>
              <span>${draftDetail.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${draftDetail.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={pending || draftDetail.lineItems.length === 0}
            className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Send quote
          </button>
        </div>
      )}

      {!draftDetail && latest && (
        <button onClick={handleRevise} disabled={pending} className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50">
          Revise (create v{latest.version + 1})
        </button>
      )}

      {quotes.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-neutral-500">
          {quotes.map((q) => (
            <li key={q.id} className="flex justify-between">
              <span>
                v{q.version} · {q.status}
              </span>
              <span>${q.total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
