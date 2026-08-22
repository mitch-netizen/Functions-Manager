import { requireSessionContext } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/domain/dashboard/queries";

export default async function DashboardPage() {
  const ctx = await requireSessionContext();
  const stats = await getDashboardStats(ctx.activeVenueId);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Enquiries this month" value={String(stats.enquiriesReceivedThisPeriod)} />
        <Stat label="Conversion rate" value={`${Math.round(stats.conversionRate * 100)}%`} />
        <Stat label="Average event value" value={stats.averageEventValue != null ? `$${stats.averageEventValue.toFixed(0)}` : "—"} />
        <Stat label="Weighted pipeline value" value={`$${stats.pipelineValueWeighted.toFixed(0)}`} />
        <Stat label="Stale enquiries" value={String(stats.staleEnquiryCount)} highlight={stats.staleEnquiryCount > 0} />
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Confirmed forward revenue by month</h2>
        {stats.confirmedForwardRevenueByMonth.length === 0 ? (
          <p className="text-sm text-neutral-400">No confirmed forward bookings yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {stats.confirmedForwardRevenueByMonth.map((m) => (
              <li key={m.month} className="flex justify-between rounded border border-neutral-200 bg-white px-3 py-2">
                <span>{m.month}</span>
                <span>${m.total.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Source breakdown</h2>
        {stats.sourceBreakdown.length === 0 ? (
          <p className="text-sm text-neutral-400">No enquiries yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {stats.sourceBreakdown.map((s) => (
              <li key={s.source} className="flex justify-between rounded border border-neutral-200 bg-white px-3 py-2">
                <span className="capitalize">{s.source.replace("_", " ")}</span>
                <span>{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded border p-3 ${highlight ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-white"}`}>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
