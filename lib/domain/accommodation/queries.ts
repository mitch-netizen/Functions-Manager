import { createClient } from "@/lib/supabase/server";

export interface AccommodationBlock {
  id: string;
  publicToken: string;
  roomTypeCode: string;
  roomsHeld: number;
  roomsBooked: number;
  checkInWindowStart: string;
  checkInWindowEnd: string;
  nightsAllowed: number;
  status: "active" | "closed" | "expired";
}

export interface AccommodationBooking {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  rmsBookingReference: string;
  status: "confirmed" | "cancelled";
}

export async function listAccommodationBlocksForEvent(eventId: string): Promise<AccommodationBlock[]> {
  const supabase = await createClient();
  const { data: blocks, error } = await supabase
    .from("accommodation_blocks")
    .select("id, public_token, rms_room_type_code, rooms_held, check_in_window_start, check_in_window_end, nights_allowed, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!blocks || blocks.length === 0) return [];

  const { data: bookings } = await supabase
    .from("accommodation_bookings")
    .select("block_id, status")
    .in(
      "block_id",
      blocks.map((b) => b.id)
    );

  const bookedCounts = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.status !== "confirmed") continue;
    bookedCounts.set(b.block_id, (bookedCounts.get(b.block_id) ?? 0) + 1);
  }

  return blocks.map((b) => ({
    id: b.id,
    publicToken: b.public_token,
    roomTypeCode: b.rms_room_type_code,
    roomsHeld: b.rooms_held,
    roomsBooked: bookedCounts.get(b.id) ?? 0,
    checkInWindowStart: b.check_in_window_start,
    checkInWindowEnd: b.check_in_window_end,
    nightsAllowed: b.nights_allowed,
    status: b.status,
  }));
}

export async function listAccommodationBookings(blockId: string): Promise<AccommodationBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_bookings")
    .select("id, guest_name, guest_email, guest_phone, check_in, check_out, rms_booking_reference, status")
    .eq("block_id", blockId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((b) => ({
    id: b.id,
    guestName: b.guest_name,
    guestEmail: b.guest_email,
    guestPhone: b.guest_phone,
    checkIn: b.check_in,
    checkOut: b.check_out,
    rmsBookingReference: b.rms_booking_reference,
    status: b.status,
  }));
}
