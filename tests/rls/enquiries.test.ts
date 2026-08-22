import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, createTestVenue, createTestUser, type TestUser, type TestVenue } from "./helpers";

// Mandated by the brief: "Write tests that attempt cross-venue reads and
// assert they fail." Run against a local `supabase start` instance (see
// .github/workflows/ci.yml) with the Phase 1 migration already applied.

describe("cross-venue RLS denial", () => {
  const admin = adminClient();
  let venueA: TestVenue;
  let venueB: TestVenue;
  let userA: TestUser; // coordinator on venue A only
  let userB: TestUser; // coordinator on venue B only
  let enquiryAId: string;

  beforeAll(async () => {
    venueA = await createTestVenue(admin, "rls-a");
    venueB = await createTestVenue(admin, "rls-b");
    userA = await createTestUser(admin, venueA.venueId, "coordinator");
    userB = await createTestUser(admin, venueB.venueId, "coordinator");

    const { data, error } = await userA.client.rpc("next_enquiry_reference", { p_venue_id: venueA.venueId });
    if (error) throw error;

    const { data: enquiry, error: insertError } = await userA.client
      .from("enquiries")
      .insert({
        venue_id: venueA.venueId,
        reference_number: data as string,
        source: "phone",
        contact_name: "Venue A Contact",
        contact_phone: "0000000000",
      })
      .select("id")
      .single();
    if (insertError || !enquiry) throw insertError;
    enquiryAId = enquiry.id;
  });

  it("does not let a user read another venue's enquiry", async () => {
    const { data, error } = await userB.client.from("enquiries").select("id").eq("id", enquiryAId);
    expect(error).toBeNull(); // RLS filters silently, it does not error
    expect(data).toEqual([]);
  });

  it("does not let a user update another venue's enquiry", async () => {
    const { data } = await userB.client
      .from("enquiries")
      .update({ contact_name: "Hijacked" })
      .eq("id", enquiryAId)
      .select("id");
    expect(data).toEqual([]); // zero rows affected, not an error

    const { data: stillOriginal } = await userA.client.from("enquiries").select("contact_name").eq("id", enquiryAId).single();
    expect(stillOriginal?.contact_name).toBe("Venue A Contact");
  });

  it("does not let a user insert an enquiry into another venue", async () => {
    const { error } = await userB.client.from("enquiries").insert({
      venue_id: venueA.venueId,
      reference_number: "SHOULD-NOT-EXIST",
      source: "phone",
      contact_name: "Attempted Cross-Venue Insert",
      contact_phone: "0000000000",
    });
    expect(error).not.toBeNull();
  });

  it("cannot allocate a reference number for a venue it doesn't belong to", async () => {
    const { error } = await userB.client.rpc("next_enquiry_reference", { p_venue_id: venueA.venueId });
    expect(error).not.toBeNull();
  });

  it("cannot transition another venue's enquiry status", async () => {
    const { error } = await userB.client.rpc("update_enquiry_status", {
      p_enquiry_id: enquiryAId,
      p_to_status: "qualifying",
    });
    expect(error).not.toBeNull();
  });
});

describe("role-restricted writes within one venue", () => {
  const admin = adminClient();
  let venue: TestVenue;
  let coordinator: TestUser;
  let manager: TestUser;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-roles");
    coordinator = await createTestUser(admin, venue.venueId, "coordinator");
    manager = await createTestUser(admin, venue.venueId, "manager");
  });

  it("blocks a coordinator from creating an event type (admin/manager only)", async () => {
    const { error } = await coordinator.client.from("event_types").insert({ venue_id: venue.venueId, name: "Should fail" });
    expect(error).not.toBeNull();
  });

  it("allows a manager to create an event type", async () => {
    const { error } = await manager.client.from("event_types").insert({ venue_id: venue.venueId, name: "Wedding" });
    expect(error).toBeNull();
  });

  it("still allows a coordinator to create an enquiry", async () => {
    const { data: ref, error: refError } = await coordinator.client.rpc("next_enquiry_reference", { p_venue_id: venue.venueId });
    expect(refError).toBeNull();

    const { error } = await coordinator.client.from("enquiries").insert({
      venue_id: venue.venueId,
      reference_number: ref as string,
      source: "walk_in",
      contact_name: "Coordinator Created",
      contact_phone: "0000000000",
    });
    expect(error).toBeNull();
  });
});
