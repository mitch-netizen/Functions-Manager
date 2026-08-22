import { describe, it, expect } from "vitest";
import { addBusinessDays } from "@/lib/automation/business-days";

describe("addBusinessDays", () => {
  it("skips weekends when adding a single business day over a Friday", () => {
    const friday = new Date("2026-08-21T00:00:00Z"); // a Friday
    const result = addBusinessDays(friday, 1);
    expect(result.getUTCDay()).toBe(1); // Monday
  });

  it("adds n business days within the same week", () => {
    const monday = new Date("2026-08-24T00:00:00Z");
    const result = addBusinessDays(monday, 3);
    expect(result.getUTCDay()).toBe(4); // Thursday
  });
});
