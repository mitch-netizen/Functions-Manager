import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, anonClient, createTestVenue, type TestVenue } from "./helpers";

describe("public enquiry form (Phase 6)", () => {
  const admin = adminClient();
  const anon = anonClient();
  let venue: TestVenue;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-public");
  });

  it("exposes only safe, narrow venue info to anon via the RPC", async () => {
    const { data, error } = await anon.rpc("get_public_venue_info", { p_slug: venue.slug });
    expect(error).toBeNull();
    expect(data?.[0]?.name).toBe(venue.slug);
  });

  it("returns nothing for an unknown venue slug", async () => {
    const { data, error } = await anon.rpc("get_public_venue_info", { p_slug: "not-a-real-venue-slug" });
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it("does not let anon read the enquiries table directly", async () => {
    const { data, error } = await anon.from("enquiries").select("id").eq("venue_id", venue.venueId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("creates an enquiry (with owner + follow-up task) through the public RPC", async () => {
    const { data, error } = await anon.rpc("create_public_enquiry", {
      p_venue_slug: venue.slug,
      p_contact_name: "Public Visitor",
      p_contact_phone: "0400000000",
      p_contact_email: "visitor@example.com",
      p_preferred_date: null,
      p_headcount_estimate: 40,
      p_event_type_id: null,
      p_brief_description: "Birthday party",
      p_ip_hash: "test-ip-hash-create",
      p_honeypot: null,
    });
    expect(error).toBeNull();
    const result = data?.[0];
    expect(result?.reference_number).toBeTruthy();

    const { data: enquiry } = await admin.from("enquiries").select("source, stage").eq("id", result!.enquiry_id).single();
    expect(enquiry?.source).toBe("website");
    expect(enquiry?.stage).toBe("new_enquiry");

    const { data: task } = await admin.from("tasks").select("id").eq("enquiry_id", result!.enquiry_id).single();
    expect(task).not.toBeNull();
  });

  it("silently no-ops when the honeypot field is filled in", async () => {
    const { data, error } = await anon.rpc("create_public_enquiry", {
      p_venue_slug: venue.slug,
      p_contact_name: "Bot Visitor",
      p_contact_phone: "0400000000",
      p_contact_email: null,
      p_preferred_date: null,
      p_headcount_estimate: null,
      p_event_type_id: null,
      p_brief_description: null,
      p_ip_hash: "test-ip-hash-honeypot",
      p_honeypot: "i-am-a-bot",
    });
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);

    const { data: contact } = await admin.from("contacts").select("id").eq("venue_id", venue.venueId).eq("name", "Bot Visitor");
    expect(contact ?? []).toEqual([]);
  });

  it("rejects a submission missing contact name", async () => {
    const { error } = await anon.rpc("create_public_enquiry", {
      p_venue_slug: venue.slug,
      p_contact_name: "",
      p_contact_phone: "0400000000",
      p_contact_email: null,
      p_preferred_date: null,
      p_headcount_estimate: null,
      p_event_type_id: null,
      p_brief_description: null,
      p_ip_hash: "test-ip-hash-missing-name",
      p_honeypot: null,
    });
    expect(error).not.toBeNull();
  });

  it("rate-limits repeated submissions from the same IP within an hour", async () => {
    const ipHash = "test-ip-hash-rate-limit";
    for (let i = 0; i < 5; i++) {
      const { error } = await anon.rpc("create_public_enquiry", {
        p_venue_slug: venue.slug,
        p_contact_name: `Rate Limit Test ${i}`,
        p_contact_phone: "0400000000",
        p_contact_email: null,
        p_preferred_date: null,
        p_headcount_estimate: null,
        p_event_type_id: null,
        p_brief_description: null,
        p_ip_hash: ipHash,
        p_honeypot: null,
      });
      expect(error).toBeNull();
    }

    const { error: sixthError } = await anon.rpc("create_public_enquiry", {
      p_venue_slug: venue.slug,
      p_contact_name: "Rate Limit Test 6",
      p_contact_phone: "0400000000",
      p_contact_email: null,
      p_preferred_date: null,
      p_headcount_estimate: null,
      p_event_type_id: null,
      p_brief_description: null,
      p_ip_hash: ipHash,
      p_honeypot: null,
    });
    expect(sixthError).not.toBeNull();
  });
});
