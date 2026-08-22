"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPackage, setPackageActive } from "@/lib/domain/admin/packages";
import type { PackageRow } from "@/lib/domain/admin/packages";

const CATEGORIES = ["food", "beverage", "room_hire", "av", "other"] as const;

export function PackagesEditor({ packages }: { packages: PackageRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    setPending(true);
    setError(null);

    const result = await createPackage({
      name,
      description: String(formData.get("description") ?? ""),
      perHeadPrice: formData.get("perHeadPrice") ? Number(formData.get("perHeadPrice")) : undefined,
      minimumNumbers: formData.get("minimumNumbers") ? Number(formData.get("minimumNumbers")) : undefined,
      inclusions: String(formData.get("inclusions") ?? ""),
      category: formData.get("category") as (typeof CATEGORIES)[number],
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (document.getElementById("package-form") as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
        {packages.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <div className={p.active ? "" : "text-neutral-400 line-through"}>
              <span className="font-medium">{p.name}</span>
              <span className="ml-2 text-xs text-neutral-400">
                {p.category} · {p.perHeadPrice ? `$${p.perHeadPrice}/head` : "no set price"}
                {p.minimumNumbers ? ` · min ${p.minimumNumbers}` : ""}
              </span>
            </div>
            <button
              onClick={async () => {
                await setPackageActive(p.id, !p.active);
                router.refresh();
              }}
              className="text-xs text-neutral-500 underline"
            >
              {p.active ? "Deactivate" : "Reactivate"}
            </button>
          </li>
        ))}
        {packages.length === 0 && <li className="px-3 py-2 text-sm text-neutral-400">None yet.</li>}
      </ul>

      <form id="package-form" action={handleAdd} className="space-y-2 rounded border border-neutral-200 bg-white p-3">
        <input name="name" placeholder="Package name" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <textarea name="description" placeholder="Description" rows={2} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <select name="category" defaultValue="food" className="rounded border border-neutral-300 px-2 py-1 text-sm">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
          <input name="perHeadPrice" type="number" min={0} step="0.01" placeholder="$ per head" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <input name="minimumNumbers" type="number" min={1} placeholder="Min numbers" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
        </div>
        <textarea
          name="inclusions"
          placeholder={"Inclusions, one per line\ne.g.\n3-course set menu\nTea & coffee"}
          rows={3}
          className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          Add package
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
