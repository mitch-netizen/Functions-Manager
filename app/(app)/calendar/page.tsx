import Link from "next/link";
import { addDays, addMonths, eachDayOfInterval, format, startOfMonth, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { requireSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listSpaces } from "@/lib/domain/admin/spaces";
import { listHoldsInRange, type CalendarHold } from "@/lib/domain/holds/queries";
import { SpaceFilter } from "./space-filter";

type ViewMode = "week" | "month";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; start?: string; spaceId?: string }>;
}) {
  const { view: rawView, start: rawStart, spaceId } = await searchParams;
  const view: ViewMode = rawView === "month" ? "month" : "week";

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { data: venue } = await supabase.from("venues").select("timezone").eq("id", ctx.activeVenueId).single();
  const timezone = venue?.timezone ?? "Australia/Brisbane";

  const anchor = rawStart ? new Date(`${rawStart}T00:00:00`) : toZonedTime(new Date(), timezone);
  const rangeStartDate = view === "week" ? startOfWeek(anchor, { weekStartsOn: 1 }) : startOfMonth(anchor);
  const days = view === "week" ? 7 : eachDayOfInterval({ start: rangeStartDate, end: addMonths(rangeStartDate, 1) }).length - 1;

  const rangeStartUtc = fromZonedTime(format(rangeStartDate, "yyyy-MM-dd'T'00:00:00"), timezone);
  const rangeEndUtc = fromZonedTime(format(addDays(rangeStartDate, days), "yyyy-MM-dd'T'00:00:00"), timezone);

  const [spaces, holds] = await Promise.all([
    listSpaces(ctx.activeVenueId),
    listHoldsInRange(ctx.activeVenueId, rangeStartUtc.toISOString(), rangeEndUtc.toISOString(), spaceId),
  ]);

  const dayList = eachDayOfInterval({ start: rangeStartDate, end: addDays(rangeStartDate, days - 1) });
  const filteredSpaces = spaceId ? spaces.filter((s) => s.id === spaceId) : spaces;

  const holdsByDayAndSpace = new Map<string, CalendarHold[]>();
  for (const hold of holds) {
    const localStart = toZonedTime(hold.startsAt, timezone);
    const localEnd = toZonedTime(hold.endsAt, timezone);
    for (const day of dayList) {
      const dayKey = format(day, "yyyy-MM-dd");
      if (localStart < addDays(day, 1) && localEnd > day) {
        const key = `${dayKey}:${hold.spaceId}`;
        const list = holdsByDayAndSpace.get(key) ?? [];
        list.push(hold);
        holdsByDayAndSpace.set(key, list);
      }
    }
  }

  const prevStart = format(addDays(rangeStartDate, view === "week" ? -7 : -days), "yyyy-MM-dd");
  const nextStart = format(addDays(rangeStartDate, view === "week" ? 7 : days), "yyyy-MM-dd");
  const qs = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ view, ...(spaceId ? { spaceId } : {}), ...overrides });
    return `/calendar?${params.toString()}`;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <SpaceFilter spaces={spaces} activeSpaceId={spaceId ?? ""} />
          <div className="flex overflow-hidden rounded border border-neutral-300 text-sm">
            <Link href={qs({ view: "week" })} className={`px-2 py-1 ${view === "week" ? "bg-neutral-900 text-white" : ""}`}>
              Week
            </Link>
            <Link href={qs({ view: "month" })} className={`px-2 py-1 ${view === "month" ? "bg-neutral-900 text-white" : ""}`}>
              Month
            </Link>
          </div>
          <Link href={qs({ start: prevStart })} className="rounded border border-neutral-300 px-2 py-1 text-sm">
            ← Prev
          </Link>
          <Link href={qs({ start: nextStart })} className="rounded border border-neutral-300 px-2 py-1 text-sm">
            Next →
          </Link>
        </div>
      </div>

      <div className="mb-3 flex gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-neutral-800" /> Confirmed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-neutral-400" /> Tentative
        </span>
      </div>

      {spaces.length === 0 ? (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          No spaces configured yet — add some under Admin → Spaces before placing holds.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 p-2 text-left text-neutral-500">Space</th>
                {dayList.map((day) => (
                  <th key={day.toISOString()} className="border-b border-neutral-200 p-2 text-left text-neutral-500">
                    {format(day, "EEE d MMM")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSpaces.map((space) => (
                <tr key={space.id} className="align-top">
                  <td className="border-b border-neutral-100 p-2 font-medium">{space.name}</td>
                  {dayList.map((day) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const cellHolds = holdsByDayAndSpace.get(`${dayKey}:${space.id}`) ?? [];
                    const hasConflict = cellHolds.some((h) => h.holdType === "confirmed") && cellHolds.length > 1;
                    return (
                      <td key={dayKey} className={`border-b border-neutral-100 p-2 ${hasConflict ? "bg-red-50" : ""}`}>
                        <div className="space-y-1">
                          {cellHolds.map((h) => (
                            <Link
                              key={h.holdId}
                              href={`/enquiries/${h.enquiryId}`}
                              className={`block rounded px-1.5 py-0.5 text-xs ${
                                h.holdType === "confirmed"
                                  ? "bg-neutral-800 text-white"
                                  : "border-2 border-dashed border-neutral-400 text-neutral-700"
                              }`}
                            >
                              {h.enquiryContactName}
                            </Link>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
