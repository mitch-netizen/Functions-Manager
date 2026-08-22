import Link from "next/link";
import { requireSessionContext } from "@/lib/auth/session";
import { signOut } from "./actions";
import { VenueSwitcher } from "./venue-switcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSessionContext();
  const activeMembership = ctx.memberships.find((m) => m.venueId === ctx.activeVenueId);
  const showSwitcher = ctx.memberships.length > 1;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <span className="font-semibold">Functions Manager</span>
          <Link href="/pipeline">Pipeline</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/enquiries/new">New enquiry</Link>
          <Link href="/tasks">My tasks</Link>
          {(ctx.activeRole === "admin" || ctx.activeRole === "manager") && <Link href="/admin/event-types">Admin</Link>}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {showSwitcher ? (
            <VenueSwitcher memberships={ctx.memberships} activeVenueId={ctx.activeVenueId} />
          ) : (
            <span className="text-neutral-500">{activeMembership?.venueName}</span>
          )}
          <form action={signOut}>
            <button type="submit" className="text-neutral-500 hover:text-neutral-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
