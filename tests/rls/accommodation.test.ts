import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, anonClient, createTestVenue, createTestUser, createTestContact, type TestUser, type TestVenue } from "./helpers";

async function createConfirmedEvent(admin: ReturnType<typeof adminClient>, coordinator: TestUser, venueId: string, contactName: string) {
  const { data: space } = await admin.from("spaces").insert({ venue_id: venueId, name: `Room for ${contactName}` }).select("id").single();

  const { data: ref } = await coordinator.client.rpc("next_enquiry_reference", { p_venue_id: venueId });
  const contactId = await createTestContact(coordinator.client, venueId, contactName);
  const { data: enquiry } = await coordinator.client
    .from("enquiries")
    .insert({ venue_id: venueId, reference_number: ref as string, source: "phone", contact_id: contactId })
    .select("id")
    .single();

  const { data: event } = await coordinator.client.rpc("confirm_enquiry", {
    p_enquiry_id: enquiry!.id,
    p_confirmed_starts_at: new Date("2027-09-01T18:00:00Z").toISOString(),
    p_confirmed_ends_at: new Date("2027-09-01T23:00:00Z").toISOString(),
    p_space_ids: [space!.id],
  });
  return event!.id as string;
}

describe("accommodation booking (RMS room block)", () => {
  const admin = adminClient();
  const anon = anonClient();
  let venueA: TestVenue;
  let venueB: TestVenue;
  let coordinatorA: TestUser;
  let viewerA: TestUser;
  let userB: TestUser;
  let eventId: string;

  beforeAll(async () => {
    venueA = await createTestVenue(admin, "rls-accom-a");
    venueB = await createTestVenue(admin, "rls-accom-b");
    coordinatorA = await createTestUser(admin, venueA.venueId, "duty_manager");
    viewerA = await createTestUser(admin, venueA.venueId, "executive_readonly");
    userB = await createTestUser(admin, venueB.venueId, "duty_manager");
    eventId = await createConfirmedEvent(admin, coordinatorA, venueA.venueId, "Accommodation Test Event");
  });

  it("lets a duty manager create a block but blocks an executive read-only user and a cross-venue user", async () => {
    const { error: viewerError } = await viewerA.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 2,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
      });
    expect(viewerError).not.toBeNull();

    const { error: crossVenueError } = await userB.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 2,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
      });
    expect(crossVenueError).not.toBeNull();
  });

  it("exposes only safe, narrow block info to anon via the RPC — not the tables directly", async () => {
    const { data: block } = await coordinatorA.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 2,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
      })
      .select("public_token")
      .single();

    const { data: publicRows, error: publicError } = await anon.rpc("get_public_accommodation_block", { p_token: block!.public_token });
    expect(publicError).toBeNull();
    expect(publicRows?.[0]?.rooms_remaining).toBe(2);

    const { data: directBlocks, error: directBlocksError } = await anon.from("accommodation_blocks").select("id");
    expect(directBlocksError).toBeNull();
    expect(directBlocks).toEqual([]);

    const { data: directBookings, error: directBookingsError } = await anon.from("accommodation_bookings").select("id");
    expect(directBookingsError).toBeNull();
    expect(directBookings).toEqual([]);
  });

  it("returns nothing for an unknown or closed token", async () => {
    const { data: unknown } = await anon.rpc("get_public_accommodation_block", { p_token: "not-a-real-token" });
    expect(unknown ?? []).toEqual([]);

    const { data: closedBlock } = await coordinatorA.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 1,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
        status: "closed",
      })
      .select("public_token")
      .single();

    const { data: closed } = await anon.rpc("get_public_accommodation_block", { p_token: closedBlock!.public_token });
    expect(closed ?? []).toEqual([]);

    const { error: bookError } = await anon.rpc("record_public_accommodation_booking", {
      p_block_token: closedBlock!.public_token,
      p_guest_name: "Closed Block Guest",
      p_guest_email: null,
      p_guest_phone: null,
      p_check_in: "2027-08-31",
      p_check_out: "2027-09-01",
      p_room_type_code: "KING",
      p_rms_booking_reference: "RMS-TEST-CLOSED",
      p_ip_hash: "test-ip-closed",
      p_honeypot: null,
    });
    expect(bookError).not.toBeNull();
  });

  it("silently no-ops when the honeypot field is filled in", async () => {
    const { data: block } = await coordinatorA.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 2,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
      })
      .select("id, public_token")
      .single();

    const { data, error } = await anon.rpc("record_public_accommodation_booking", {
      p_block_token: block!.public_token,
      p_guest_name: "Bot Guest",
      p_guest_email: null,
      p_guest_phone: null,
      p_check_in: "2027-08-31",
      p_check_out: "2027-09-01",
      p_room_type_code: "KING",
      p_rms_booking_reference: "RMS-TEST-BOT",
      p_ip_hash: "test-ip-honeypot",
      p_honeypot: "i-am-a-bot",
    });
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);

    const { data: bookings } = await admin.from("accommodation_bookings").select("id").eq("block_id", block!.id);
    expect(bookings ?? []).toEqual([]);
  });

  it("enforces the capacity backstop once a block's rooms_held is exhausted", async () => {
    const { data: block } = await coordinatorA.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 2,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
      })
      .select("public_token")
      .single();

    for (let i = 0; i < 2; i++) {
      const { error } = await anon.rpc("record_public_accommodation_booking", {
        p_block_token: block!.public_token,
        p_guest_name: `Capacity Guest ${i}`,
        p_guest_email: null,
        p_guest_phone: null,
        p_check_in: "2027-08-31",
        p_check_out: "2027-09-01",
        p_room_type_code: "KING",
        p_rms_booking_reference: `RMS-TEST-CAP-${i}`,
        p_ip_hash: `test-ip-cap-${i}`,
        p_honeypot: null,
      });
      expect(error).toBeNull();
    }

    const { error: thirdError } = await anon.rpc("record_public_accommodation_booking", {
      p_block_token: block!.public_token,
      p_guest_name: "Capacity Guest Overflow",
      p_guest_email: null,
      p_guest_phone: null,
      p_check_in: "2027-08-31",
      p_check_out: "2027-09-01",
      p_room_type_code: "KING",
      p_rms_booking_reference: "RMS-TEST-CAP-OVERFLOW",
      p_ip_hash: "test-ip-cap-overflow",
      p_honeypot: null,
    });
    expect(thirdError).not.toBeNull();

    const { data: publicRows } = await anon.rpc("get_public_accommodation_block", { p_token: block!.public_token });
    expect(publicRows?.[0]?.rooms_remaining).toBe(0);
  });

  it("rate-limits repeated booking attempts from the same IP within an hour", async () => {
    const { data: block } = await coordinatorA.client
      .from("accommodation_blocks")
      .insert({
        venue_id: venueA.venueId,
        event_id: eventId,
        rms_room_type_code: "KING",
        rooms_held: 20,
        check_in_window_start: "2027-08-30",
        check_in_window_end: "2027-09-02",
      })
      .select("public_token")
      .single();

    const ipHash = "test-ip-accom-rate-limit";
    for (let i = 0; i < 5; i++) {
      const { error } = await anon.rpc("record_public_accommodation_booking", {
        p_block_token: block!.public_token,
        p_guest_name: `Rate Limit Guest ${i}`,
        p_guest_email: null,
        p_guest_phone: null,
        p_check_in: "2027-08-31",
        p_check_out: "2027-09-01",
        p_room_type_code: "KING",
        p_rms_booking_reference: `RMS-TEST-RATE-${i}`,
        p_ip_hash: ipHash,
        p_honeypot: null,
      });
      expect(error).toBeNull();
    }

    const { error: sixthError } = await anon.rpc("record_public_accommodation_booking", {
      p_block_token: block!.public_token,
      p_guest_name: "Rate Limit Guest 6",
      p_guest_email: null,
      p_guest_phone: null,
      p_check_in: "2027-08-31",
      p_check_out: "2027-09-01",
      p_room_type_code: "KING",
      p_rms_booking_reference: "RMS-TEST-RATE-6",
      p_ip_hash: ipHash,
      p_honeypot: null,
    });
    expect(sixthError).not.toBeNull();
  });
});
