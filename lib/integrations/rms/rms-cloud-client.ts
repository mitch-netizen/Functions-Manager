import type { RmsAvailabilityResult, RmsBookingParams, RmsBookingResult, RmsClient, RmsCredentials } from "./client";

// This sandbox's network egress proxy blocked every attempt to fetch RMS
// Cloud's own API reference (restapidocs.rmscloud.com, the RMSHospitality
// SwaggerHub page, and the RMS Postman workspace all returned
// EGRESS_BLOCKED), so the endpoint paths and payload shapes below are
// structurally reasonable placeholders, not confirmed against RMS's real
// contract. Every TODO below marks something that must be verified against
// RMS's actual docs/Postman collection before this file is used against a
// live property — see DECISIONS.md.
const RMS_API_BASE = "https://api.rmscloud.com"; // TODO: confirm base URL

/**
 * Real implementation against RMS Cloud's REST API.
 */
class RmsCloudClient implements RmsClient {
  private async authenticate(credentials: RmsCredentials): Promise<string> {
    // TODO: confirm the real auth endpoint/payload/response shape.
    const response = await fetch(`${RMS_API_BASE}/authToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        AgentId: credentials.agentId,
        AgentPassword: credentials.apiKey,
        ClientId: credentials.clientId,
      }),
    });
    if (!response.ok) throw new Error(`RMS authentication failed: ${response.status}`);
    const data = (await response.json()) as { token?: string; Token?: string };
    const token = data.token ?? data.Token;
    if (!token) throw new Error("RMS authentication response did not include a token");
    return token;
  }

  async checkAvailability(credentials: RmsCredentials, roomTypeCode: string, checkIn: string, checkOut: string): Promise<RmsAvailabilityResult> {
    const token = await this.authenticate(credentials);
    // TODO: confirm the real availability endpoint/payload/response shape.
    const response = await fetch(
      `${RMS_API_BASE}/roomTypes/${encodeURIComponent(roomTypeCode)}/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`RMS availability check failed: ${response.status}`);
    const data = (await response.json()) as { available?: boolean; Available?: boolean; ratePerNight?: number; RatePerNight?: number };
    return {
      available: Boolean(data.available ?? data.Available),
      ratePerNight: data.ratePerNight ?? data.RatePerNight,
    };
  }

  async createBooking(credentials: RmsCredentials, params: RmsBookingParams): Promise<RmsBookingResult> {
    const token = await this.authenticate(credentials);
    // TODO: confirm the real booking-creation endpoint/payload/response shape.
    const response = await fetch(`${RMS_API_BASE}/bookings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        RoomTypeCode: params.roomTypeCode,
        ArriveDate: params.checkIn,
        DepartDate: params.checkOut,
        GuestName: params.guestName,
        GuestEmail: params.guestEmail ?? undefined,
        GuestPhone: params.guestPhone ?? undefined,
      }),
    });
    if (!response.ok) throw new Error(`RMS booking creation failed: ${response.status}`);
    const data = (await response.json()) as { bookingId?: string | number; BookingId?: string | number; reservationId?: string | number };
    const reference = data.bookingId ?? data.BookingId ?? data.reservationId;
    if (reference === undefined) throw new Error("RMS booking response did not include a reference");
    return { rmsBookingReference: String(reference) };
  }

  async cancelBooking(credentials: RmsCredentials, rmsBookingReference: string): Promise<void> {
    const token = await this.authenticate(credentials);
    // TODO: confirm the real cancellation endpoint/payload shape.
    const response = await fetch(`${RMS_API_BASE}/bookings/${encodeURIComponent(rmsBookingReference)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`RMS booking cancellation failed: ${response.status}`);
  }
}

export function getRmsClient(): RmsClient {
  return new RmsCloudClient();
}
