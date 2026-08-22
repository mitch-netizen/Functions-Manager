import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSessionContext } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSessionContext();
  // Defense in depth on top of RLS — a coordinator/viewer gets redirected
  // rather than loading an admin page that silently returns nothing.
  if (ctx.activeRole !== "admin" && ctx.activeRole !== "manager") redirect("/pipeline");

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 flex gap-4 border-b border-neutral-200 pb-2 text-sm font-medium text-neutral-600">
        <Link href="/admin/event-types">Event types</Link>
        <Link href="/admin/lost-reasons">Lost reasons</Link>
        <Link href="/admin/users">Users</Link>
        <Link href="/admin/venue-settings">Venue settings</Link>
      </nav>
      {children}
    </div>
  );
}
