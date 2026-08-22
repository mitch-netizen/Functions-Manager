import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, createTestVenue, createTestUser, type TestUser, type TestVenue } from "./helpers";

async function createEnquiry(user: TestUser, venueId: string, contactName: string) {
  const { data: ref } = await user.client.rpc("next_enquiry_reference", { p_venue_id: venueId });
  const { data: enquiry } = await user.client
    .from("enquiries")
    .insert({ venue_id: venueId, reference_number: ref as string, source: "phone", contact_name: contactName, contact_phone: "0000000000" })
    .select("id")
    .single();
  return enquiry!.id as string;
}

describe("confirm_enquiry: the pivotal confirmation transaction", () => {
  const admin = adminClient();
  let venueA: TestVenue;
  let venueB: TestVenue;
  let coordinatorA: TestUser;
  let viewerA: TestUser;
  let userB: TestUser;
  let spaceId: string;

  beforeAll(async () => {
    venueA = await createTestVenue(admin, "rls-confirm-a");
    venueB = await createTestVenue(admin, "rls-confirm-b");
    coordinatorA = await createTestUser(admin, venueA.venueId, "coordinator");
    viewerA = await createTestUser(admin, venueA.venueId, "viewer");
    userB = await createTestUser(admin, venueB.venueId, "coordinator");

    const { data: space } = await admin.from("spaces").insert({ venue_id: venueA.venueId, name: "Function Room" }).select("id").single();
    spaceId = space!.id;
  });

  it("creates an event and a confirmed hold on success", async () => {
    const enquiryId = await createEnquiry(coordinatorA, venueA.venueId, "Confirm Success");
    const startsAt = new Date("2027-03-01T10:00:00Z").toISOString();
    const endsAt = new Date("2027-03-01T14:00:00Z").toISOString();

    const { data: event, error } = await coordinatorA.client.rpc("confirm_enquiry", {
      p_enquiry_id: enquiryId,
      p_confirmed_starts_at: startsAt,
      p_confirmed_ends_at: endsAt,
      p_space_ids: [spaceId],
    });
    expect(error).toBeNull();
    expect(event?.enquiry_id).toBe(enquiryId);

    const { data: hold } = await coordinatorA.client.from("holds").select("hold_type").eq("enquiry_id", enquiryId).single();
    expect(hold?.hold_type).toBe("confirmed");

    const { data: enquiry } = await coordinatorA.client.from("enquiries").select("status").eq("id", enquiryId).single();
    expect(enquiry?.status).toBe("confirmed");
  });

  it("rejects confirming a space that's already confirmed for an overlapping time", async () => {
    const firstEnquiryId = await createEnquiry(coordinatorA, venueA.venueId, "First Booking");
    await coordinatorA.client.rpc("confirm_enquiry", {
      p_enquiry_id: firstEnquiryId,
      p_confirmed_starts_at: new Date("2027-04-01T18:00:00Z").toISOString(),
      p_confirmed_ends_at: new Date("2027-04-01T23:00:00Z").toISOString(),
      p_space_ids: [spaceId],
    });

    const secondEnquiryId = await createEnquiry(coordinatorA, venueA.venueId, "Conflicting Booking");
    const { error } = await coordinatorA.client.rpc("confirm_enquiry", {
      p_enquiry_id: secondEnquiryId,
      p_confirmed_starts_at: new Date("2027-04-01T20:00:00Z").toISOString(),
      p_confirmed_ends_at: new Date("2027-04-02T01:00:00Z").toISOString(),
      p_space_ids: [spaceId],
    });
    expect(error).not.toBeNull();
    expect(error?.message).toContain("First Booking");
  });

  it("blocks a viewer from confirming an enquiry", async () => {
    const enquiryId = await createEnquiry(coordinatorA, venueA.venueId, "Viewer Blocked");
    const { error } = await viewerA.client.rpc("confirm_enquiry", {
      p_enquiry_id: enquiryId,
      p_confirmed_starts_at: new Date("2027-05-01T10:00:00Z").toISOString(),
      p_confirmed_ends_at: new Date("2027-05-01T14:00:00Z").toISOString(),
      p_space_ids: [spaceId],
    });
    expect(error).not.toBeNull();
  });

  it("blocks a user from another venue from confirming this venue's enquiry", async () => {
    const enquiryId = await createEnquiry(coordinatorA, venueA.venueId, "Cross Venue Blocked");
    const { error } = await userB.client.rpc("confirm_enquiry", {
      p_enquiry_id: enquiryId,
      p_confirmed_starts_at: new Date("2027-06-01T10:00:00Z").toISOString(),
      p_confirmed_ends_at: new Date("2027-06-01T14:00:00Z").toISOString(),
      p_space_ids: [spaceId],
    });
    expect(error).not.toBeNull();
  });

  it("does not allow a direct client insert into events — only confirm_enquiry() can create one", async () => {
    const enquiryId = await createEnquiry(coordinatorA, venueA.venueId, "Direct Insert Blocked");
    // events.Insert is typed as `never` (see database.types.ts) precisely
    // because only confirm_enquiry() may create one — cast to bypass that
    // at the type layer so we can confirm the database itself rejects a
    // direct insert too, not just the generated types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventsTable = coordinatorA.client.from("events") as any;
    const { error } = await eventsTable.insert({
      venue_id: venueA.venueId,
      enquiry_id: enquiryId,
      confirmed_starts_at: new Date("2027-07-01T10:00:00Z").toISOString(),
      confirmed_ends_at: new Date("2027-07-01T14:00:00Z").toISOString(),
    });
    expect(error).not.toBeNull();
  });
});
