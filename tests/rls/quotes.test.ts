import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, createTestVenue, createTestUser, createTestContact, type TestUser, type TestVenue } from "./helpers";

describe("packages: role-restricted writes", () => {
  const admin = adminClient();
  let venue: TestVenue;
  let coordinator: TestUser;
  let manager: TestUser;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-packages");
    coordinator = await createTestUser(admin, venue.venueId, "duty_manager");
    manager = await createTestUser(admin, venue.venueId, "functions_manager");
  });

  it("blocks a duty manager from creating a package (admin/functions_manager only, per the brief)", async () => {
    const { error } = await coordinator.client.from("packages").insert({ venue_id: venue.venueId, name: "Should fail", category: "food" });
    expect(error).not.toBeNull();
  });

  it("allows a functions manager to create a package", async () => {
    const { error } = await manager.client.from("packages").insert({ venue_id: venue.venueId, name: "Set menu", category: "food", per_head_price: 85 });
    expect(error).toBeNull();
  });
});

describe("quotes: immutability once sent", () => {
  const admin = adminClient();
  let venue: TestVenue;
  let coordinator: TestUser;
  let enquiryId: string;
  let quoteId: string;
  let lineItemId: string;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-quote-immutability");
    coordinator = await createTestUser(admin, venue.venueId, "duty_manager");

    const { data: ref } = await coordinator.client.rpc("next_enquiry_reference", { p_venue_id: venue.venueId });
    const contactId = await createTestContact(coordinator.client, venue.venueId, "Quote Test Contact");
    const { data: enquiry } = await coordinator.client
      .from("enquiries")
      .insert({
        venue_id: venue.venueId,
        reference_number: ref as string,
        source: "phone",
        contact_id: contactId,
      })
      .select("id")
      .single();
    enquiryId = enquiry!.id;

    const { data: quote } = await coordinator.client
      .from("quotes")
      .insert({ venue_id: venue.venueId, enquiry_id: enquiryId, version: 1 })
      .select("id")
      .single();
    quoteId = quote!.id;

    const { data: lineItem } = await coordinator.client
      .from("quote_line_items")
      .insert({ venue_id: venue.venueId, quote_id: quoteId, description: "Test line", quantity: 1, unit_price: 100, line_total: 100 })
      .select("id")
      .single();
    lineItemId = lineItem!.id;

    const { error: sendError } = await coordinator.client.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", quoteId);
    expect(sendError).toBeNull();
  });

  it("rejects adding a line item to a quote that is no longer draft", async () => {
    const { error } = await coordinator.client
      .from("quote_line_items")
      .insert({ venue_id: venue.venueId, quote_id: quoteId, description: "Too late", quantity: 1, unit_price: 1, line_total: 1 });
    expect(error).not.toBeNull();
  });

  it("rejects modifying an existing line item on a sent quote", async () => {
    const { error } = await coordinator.client.from("quote_line_items").update({ quantity: 99 }).eq("id", lineItemId);
    expect(error).not.toBeNull();
  });

  it("rejects changing the quote's total once sent", async () => {
    const { error } = await coordinator.client.from("quotes").update({ total: 99999 }).eq("id", quoteId);
    expect(error).not.toBeNull();
  });

  it("still allows a status-only transition on a sent quote (e.g. superseding it)", async () => {
    const { error } = await coordinator.client.from("quotes").update({ status: "superseded" }).eq("id", quoteId);
    expect(error).toBeNull();
  });
});
