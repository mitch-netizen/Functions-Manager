import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicEnquiryForm } from "./form";

export default async function PublicEnquiryPage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const { venueSlug } = await params;
  const supabase = await createClient();

  const [{ data: venueRows }, { data: eventTypeRows }] = await Promise.all([
    supabase.rpc("get_public_venue_info", { p_slug: venueSlug }),
    supabase.rpc("get_public_event_types", { p_slug: venueSlug }),
  ]);

  const venue = venueRows?.[0];
  if (!venue) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">{venue.name}</h1>
      <p className="mb-6 text-sm text-neutral-500">Tell us about your event and we&apos;ll be in touch.</p>
      <PublicEnquiryForm
        venueSlug={venueSlug}
        eventTypes={eventTypeRows ?? []}
        privacyNoticeUrl={venue.privacy_notice_url}
      />
    </div>
  );
}
