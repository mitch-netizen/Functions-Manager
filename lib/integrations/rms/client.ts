export interface RmsCredentials {
  agentId: string;
  clientId: string;
  apiKey: string;
}

export interface RmsAvailabilityResult {
  available: boolean;
  ratePerNight?: number;
}

export interface RmsBookingParams {
  roomTypeCode: string;
  checkIn: string; // yyyy-MM-dd
  checkOut: string; // yyyy-MM-dd
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
}

export interface RmsBookingResult {
  rmsBookingReference: string;
}

/**
 * Swappable interface for the venue's accommodation/PMS provider — same
 * pattern as lib/email/sender.ts. Every method takes the venue's
 * credentials explicitly rather than reading them from env vars, since
 * (unlike Resend) RMS credentials are per-venue data stored in
 * venue_rms_credentials, not a single global secret.
 */
export interface RmsClient {
  checkAvailability(credentials: RmsCredentials, roomTypeCode: string, checkIn: string, checkOut: string): Promise<RmsAvailabilityResult>;
  createBooking(credentials: RmsCredentials, params: RmsBookingParams): Promise<RmsBookingResult>;
  cancelBooking(credentials: RmsCredentials, rmsBookingReference: string): Promise<void>;
}
