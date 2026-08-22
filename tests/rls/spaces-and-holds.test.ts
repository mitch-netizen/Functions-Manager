import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, createTestVenue, createTestUser, type TestUser, type TestVenue } from "./helpers";

describe("spaces: cross-venue denial and role restriction", () => {
  const admin = adminClient();
  let venueA: TestVenue;
  let venueB: TestVenue;
  let coordinatorA: TestUser;
  let managerA: TestUser;
  let userB: TestUser;
  let spaceAId: string;

  beforeAll(async () => {
    venueA = await createTestVenue(admin, "rls-spaces-a");
    venueB = await createTestVenue(admin, "rls-spaces-b");
    coordinatorA = await createTestUser(admin, venueA.venueId, "coordinator");
    managerA = await createTestUser(admin, venueA.venueId, "manager");
    userB = await createTestUser(admin, venueB.venueId, "coordinator");

    const { data, error } = await managerA.client.from("spaces").insert({ venue_id: venueA.venueId, name: "Main Hall" }).select("id").single();
    if (error || !data) throw error;
    spaceAId = data.id;
  });

  it("blocks a coordinator from creating a space (admin/manager only)", async () => {
    const { error } = await coordinatorA.client.from("spaces").insert({ venue_id: venueA.venueId, name: "Should fail" });
    expect(error).not.toBeNull();
  });

  it("does not let a user from another venue read this venue's spaces", async () => {
    const { data, error } = await userB.client.from("spaces").select("id").eq("id", spaceAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("does not let a user from another venue deactivate this venue's space", async () => {
    const { data } = await userB.client.from("spaces").update({ active: false }).eq("id", spaceAId).select("id");
    expect(data).toEqual([]);
  });
});

describe("holds: confirmed-vs-confirmed overlap is rejected, tentative is not", () => {
  const admin = adminClient();
  let venue: TestVenue;
  let coordinator: TestUser;
  let spaceId: string;
  let enquiryOneId: string;
  let enquiryTwoId: string;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-holds");
    coordinator = await createTestUser(admin, venue.venueId, "coordinator");

    const { data: space } = await admin.from("spaces").insert({ venue_id: venue.venueId, name: "Ballroom" }).select("id").single();
    spaceId = space!.id;

    for (const label of ["one", "two"] as const) {
      const { data: ref } = await coordinator.client.rpc("next_enquiry_reference", { p_venue_id: venue.venueId });
      const { data: enquiry } = await coordinator.client
        .from("enquiries")
        .insert({
          venue_id: venue.venueId,
          reference_number: ref as string,
          source: "phone",
          contact_name: `Contact ${label}`,
          contact_phone: "0000000000",
        })
        .select("id")
        .single();
      if (label === "one") enquiryOneId = enquiry!.id;
      else enquiryTwoId = enquiry!.id;
    }
  });

  it("allows two overlapping tentative holds on the same space", async () => {
    const startsAt = new Date("2027-01-10T10:00:00Z").toISOString();
    const endsAt = new Date("2027-01-10T14:00:00Z").toISOString();

    const first = await coordinator.client.from("holds").insert({
      venue_id: venue.venueId,
      space_id: spaceId,
      enquiry_id: enquiryOneId,
      starts_at: startsAt,
      ends_at: endsAt,
      hold_type: "tentative",
    });
    expect(first.error).toBeNull();

    const second = await coordinator.client.from("holds").insert({
      venue_id: venue.venueId,
      space_id: spaceId,
      enquiry_id: enquiryTwoId,
      starts_at: startsAt,
      ends_at: endsAt,
      hold_type: "tentative",
    });
    expect(second.error).toBeNull();
  });

  it("rejects a confirmed hold overlapping an existing confirmed hold on the same space", async () => {
    const startsAt = new Date("2027-02-10T18:00:00Z").toISOString();
    const endsAt = new Date("2027-02-10T23:00:00Z").toISOString();

    const first = await coordinator.client.from("holds").insert({
      venue_id: venue.venueId,
      space_id: spaceId,
      enquiry_id: enquiryOneId,
      starts_at: startsAt,
      ends_at: endsAt,
      hold_type: "confirmed",
    });
    expect(first.error).toBeNull();

    const overlappingStart = new Date("2027-02-10T20:00:00Z").toISOString();
    const overlappingEnd = new Date("2027-02-11T01:00:00Z").toISOString();

    const second = await coordinator.client.from("holds").insert({
      venue_id: venue.venueId,
      space_id: spaceId,
      enquiry_id: enquiryTwoId,
      starts_at: overlappingStart,
      ends_at: overlappingEnd,
      hold_type: "confirmed",
    });
    expect(second.error).not.toBeNull();
    expect(second.error?.code).toBe("23P01");
  });
});
