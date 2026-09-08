import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, createTestVenue, createTestUser, createTestContact, type TestUser, type TestVenue } from "./helpers";

// Mandated by the brief: "Write tests that attempt cross-venue reads and
// assert they fail." Run against a local `supabase start` instance (see
// .github/workflows/ci.yml) with the Phase 1 migration already applied.

describe("cross-venue RLS denial", () => {
  const admin = adminClient();
  let venueA: TestVenue;
  let venueB: TestVenue;
  let userA: TestUser; // duty_manager on venue A only
  let userB: TestUser; // duty_manager on venue B only
  let enquiryAId: string;

  beforeAll(async () => {
    venueA = await createTestVenue(admin, "rls-a");
    venueB = await createTestVenue(admin, "rls-b");
    userA = await createTestUser(admin, venueA.venueId, "duty_manager");
    userB = await createTestUser(admin, venueB.venueId, "duty_manager");

    const { data, error } = await userA.client.rpc("next_enquiry_reference", { p_venue_id: venueA.venueId });
    if (error) throw error;

    const contactId = await createTestContact(userA.client, venueA.venueId, "Venue A Contact");

    const { data: enquiry, error: insertError } = await userA.client
      .from("enquiries")
      .insert({
        venue_id: venueA.venueId,
        reference_number: data as string,
        source: "phone",
        contact_id: contactId,
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
      .update({ brief_description: "Hijacked" })
      .eq("id", enquiryAId)
      .select("id");
    expect(data).toEqual([]); // zero rows affected, not an error

    const { data: stillOriginal } = await userA.client.from("enquiries").select("brief_description").eq("id", enquiryAId).single();
    expect(stillOriginal?.brief_description).toBeNull();
  });

  it("does not let a user insert an enquiry into another venue", async () => {
    const contactId = await createTestContact(userB.client, venueB.venueId, "Attempted Cross-Venue Insert");
    const { error } = await userB.client.from("enquiries").insert({
      venue_id: venueA.venueId,
      reference_number: "SHOULD-NOT-EXIST",
      source: "phone",
      contact_id: contactId,
    });
    expect(error).not.toBeNull();
  });

  it("cannot allocate a reference number for a venue it doesn't belong to", async () => {
    const { error } = await userB.client.rpc("next_enquiry_reference", { p_venue_id: venueA.venueId });
    expect(error).not.toBeNull();
  });

  it("cannot transition another venue's enquiry stage", async () => {
    const { error } = await userB.client.rpc("update_enquiry_status", {
      p_enquiry_id: enquiryAId,
      p_to_stage: "active_enquiry",
    });
    expect(error).not.toBeNull();
  });
});

describe("role-restricted writes within one venue", () => {
  const admin = adminClient();
  let venue: TestVenue;
  let dutyManager: TestUser;
  let functionsManager: TestUser;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-roles");
    dutyManager = await createTestUser(admin, venue.venueId, "duty_manager");
    functionsManager = await createTestUser(admin, venue.venueId, "functions_manager");
  });

  it("blocks a duty manager from creating an event type (admin/functions_manager only)", async () => {
    const { error } = await dutyManager.client.from("event_types").insert({ venue_id: venue.venueId, name: "Should fail" });
    expect(error).not.toBeNull();
  });

  it("allows a functions manager to create an event type", async () => {
    const { error } = await functionsManager.client.from("event_types").insert({ venue_id: venue.venueId, name: "Wedding" });
    expect(error).toBeNull();
  });

  it("still allows a duty manager to create an enquiry", async () => {
    const { data: ref, error: refError } = await dutyManager.client.rpc("next_enquiry_reference", { p_venue_id: venue.venueId });
    expect(refError).toBeNull();

    const contactId = await createTestContact(dutyManager.client, venue.venueId, "Duty Manager Created");
    const { error } = await dutyManager.client.from("enquiries").insert({
      venue_id: venue.venueId,
      reference_number: ref as string,
      source: "walk_in",
      contact_id: contactId,
    });
    expect(error).toBeNull();
  });
});
