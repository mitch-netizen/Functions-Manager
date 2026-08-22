import type { RmsClient, RmsCredentials } from "@/lib/integrations/rms/client";

export interface BookAccommodationInput {
  roomTypeCode: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
}

export type BookAccommodationResult = { ok: true; rmsBookingReference: string } | { ok: false; error: string; status: number };

export type RecordBooking = (rmsBookingReference: string) => Promise<{ ok: true } | { ok: false; error: string }>;

/**
 * The orchestration at the heart of app/api/public-accommodation/route.ts,
 * pulled out as a pure function over injected dependencies (an RmsClient
 * and a recordBooking callback) so its three distinct paths are
 * unit-testable without a real RMS account or database:
 *  1. availability fails → nothing else is attempted.
 *  2. RMS succeeds but recordBooking rejects (block full/rate-limited/etc)
 *     → the RMS-side reservation is compensated with cancelBooking, since
 *     RMS was already told "yes" before our own capacity check ran.
 *  3. both succeed.
 * See tests/unit/accommodation-booking-flow.test.ts.
 */
export async function bookAccommodation(
  rms: RmsClient,
  credentials: RmsCredentials,
  input: BookAccommodationInput,
  recordBooking: RecordBooking
): Promise<BookAccommodationResult> {
  let availability;
  try {
    availability = await rms.checkAvailability(credentials, input.roomTypeCode, input.checkIn, input.checkOut);
  } catch {
    return { ok: false, error: "Couldn't check availability right now — please try again shortly.", status: 502 };
  }
  if (!availability.available) {
    return { ok: false, error: "No rooms available for those dates — try different dates.", status: 409 };
  }

  let booking;
  try {
    booking = await rms.createBooking(credentials, input);
  } catch {
    return { ok: false, error: "Couldn't create the booking right now — please try again shortly.", status: 502 };
  }

  const recorded = await recordBooking(booking.rmsBookingReference);
  if (!recorded.ok) {
    try {
      await rms.cancelBooking(credentials, booking.rmsBookingReference);
    } catch {
      // Best-effort: the booking is recorded nowhere on our side either
      // way; a human will need to reconcile this one directly in RMS.
    }
    return { ok: false, error: recorded.error, status: 409 };
  }

  return { ok: true, rmsBookingReference: booking.rmsBookingReference };
}
