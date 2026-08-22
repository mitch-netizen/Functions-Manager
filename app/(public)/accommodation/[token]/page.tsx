import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccommodationBookingForm } from "./form";

export default async function PublicAccommodationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase.rpc("get_public_accommodation_block", { p_token: token });
  const block = rows?.[0];
  if (!block) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">{block.venue_name}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Book your room for this event — {block.rooms_remaining} of the block still available.
      </p>
      {block.rooms_remaining > 0 ? (
        <AccommodationBookingForm
          token={token}
          checkInWindowStart={block.check_in_window_start}
          checkInWindowEnd={block.check_in_window_end}
          nightsAllowed={block.nights_allowed}
        />
      ) : (
        <p className="rounded border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          This room block is fully booked — please contact the venue directly for other availability.
        </p>
      )}
    </div>
  );
}
