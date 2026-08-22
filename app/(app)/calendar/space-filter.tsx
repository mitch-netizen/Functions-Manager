"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { SpaceRow } from "@/lib/domain/admin/spaces";

export function SpaceFilter({ spaces, activeSpaceId }: { spaces: SpaceRow[]; activeSpaceId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(spaceId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (spaceId) params.set("spaceId", spaceId);
    else params.delete("spaceId");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={activeSpaceId}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border border-neutral-300 px-2 py-1 text-sm"
    >
      <option value="">All spaces</option>
      {spaces.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
