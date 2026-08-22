import { describe, it, expect, beforeAll } from "vitest";
import { adminClient, createTestVenue, createTestUser, type TestUser, type TestVenue } from "./helpers";

describe("automation_job_runs: idempotency ledger", () => {
  const admin = adminClient();
  let venue: TestVenue;
  let coordinator: TestUser;
  let enquiryId: string;

  beforeAll(async () => {
    venue = await createTestVenue(admin, "rls-automation");
    coordinator = await createTestUser(admin, venue.venueId, "coordinator");

    const { data: ref } = await coordinator.client.rpc("next_enquiry_reference", { p_venue_id: venue.venueId });
    const { data: enquiry } = await coordinator.client
      .from("enquiries")
      .insert({ venue_id: venue.venueId, reference_number: ref as string, source: "phone", contact_name: "Automation Test", contact_phone: "0000000000" })
      .select("id")
      .single();
    enquiryId = enquiry!.id;
  });

  it("blocks a regular RLS-scoped client from inserting directly — only the admin client (cron route) may write here", async () => {
    const { error } = await coordinator.client
      .from("automation_job_runs")
      .insert({ rule_key: "stale_enquiry", subject_table: "enquiries", subject_id: enquiryId });
    expect(error).not.toBeNull();
  });

  it("lets the admin client claim a rule firing, and rejects a second claim for the same subject/occurrence", async () => {
    const first = await admin
      .from("automation_job_runs")
      .insert({ rule_key: "stale_enquiry", subject_table: "enquiries", subject_id: enquiryId, occurrence_key: "2027-01-01" });
    expect(first.error).toBeNull();

    const duplicate = await admin
      .from("automation_job_runs")
      .insert({ rule_key: "stale_enquiry", subject_table: "enquiries", subject_id: enquiryId, occurrence_key: "2027-01-01" });
    expect(duplicate.error).not.toBeNull();
    expect(duplicate.error?.code).toBe("23505");
  });

  it("allows a new claim for the same subject once the occurrence_key changes (a later staleness episode)", async () => {
    const laterOccurrence = await admin
      .from("automation_job_runs")
      .insert({ rule_key: "stale_enquiry", subject_table: "enquiries", subject_id: enquiryId, occurrence_key: "2027-02-01" });
    expect(laterOccurrence.error).toBeNull();
  });
});
