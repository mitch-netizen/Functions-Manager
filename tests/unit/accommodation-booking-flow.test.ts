import { describe, it, expect, vi } from "vitest";
import { bookAccommodation } from "@/lib/domain/accommodation/booking-flow";
import type { RmsClient, RmsCredentials } from "@/lib/integrations/rms/client";

const credentials: RmsCredentials = { agentId: "agent", clientId: "client", apiKey: "key" };
const input = {
  roomTypeCode: "KING",
  checkIn: "2027-08-31",
  checkOut: "2027-09-01",
  guestName: "Jane Sample",
  guestEmail: "jane@example.com",
  guestPhone: null,
};

function fakeRms(overrides: Partial<RmsClient> = {}): RmsClient {
  return {
    checkAvailability: vi.fn().mockResolvedValue({ available: true }),
    createBooking: vi.fn().mockResolvedValue({ rmsBookingReference: "RMS-123" }),
    cancelBooking: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bookAccommodation", () => {
  it("does not attempt a booking when availability check fails", async () => {
    const createBookingMock = vi.fn();
    const rms = fakeRms({
      checkAvailability: vi.fn().mockResolvedValue({ available: false }),
      createBooking: createBookingMock,
    });
    const recordBooking = vi.fn();

    const result = await bookAccommodation(rms, credentials, input, recordBooking);

    expect(result.ok).toBe(false);
    expect(createBookingMock).not.toHaveBeenCalled();
    expect(recordBooking).not.toHaveBeenCalled();
  });

  it("compensates with cancelBooking when RMS succeeds but recordBooking rejects", async () => {
    const rms = fakeRms();
    const recordBooking = vi.fn().mockResolvedValue({ ok: false, error: "this room block is fully booked" });

    const result = await bookAccommodation(rms, credentials, input, recordBooking);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("this room block is fully booked");
    expect(rms.cancelBooking).toHaveBeenCalledWith(credentials, "RMS-123");
  });

  it("succeeds and never calls cancelBooking when both RMS and recordBooking succeed", async () => {
    const rms = fakeRms();
    const recordBooking = vi.fn().mockResolvedValue({ ok: true });

    const result = await bookAccommodation(rms, credentials, input, recordBooking);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rmsBookingReference).toBe("RMS-123");
    expect(rms.cancelBooking).not.toHaveBeenCalled();
  });

  it("does not throw if the compensating cancelBooking call itself fails", async () => {
    const rms = fakeRms({ cancelBooking: vi.fn().mockRejectedValue(new Error("RMS is down")) });
    const recordBooking = vi.fn().mockResolvedValue({ ok: false, error: "rejected" });

    const result = await bookAccommodation(rms, credentials, input, recordBooking);

    expect(result.ok).toBe(false);
  });
});
