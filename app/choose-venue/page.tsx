import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { chooseVenue } from "./actions";

export default async function ChooseVenuePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.activeVenueId) redirect("/pipeline");

  return (
    <div className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-8">
        <h1 className="text-xl font-semibold">Choose a venue</h1>
        <ul className="space-y-2">
          {ctx.memberships.map((m) => (
            <li key={m.venueId}>
              <form action={chooseVenue}>
                <input type="hidden" name="venueId" value={m.venueId} />
                <button
                  type="submit"
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  {m.venueName} <span className="text-neutral-400">({m.role})</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
