import { describe, it, expect } from "vitest";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { RunSheetPdf } from "@/lib/pdf/run-sheet-template";
import type { EventDetail } from "@/lib/domain/events/queries";

describe("RunSheetPdf rendering", () => {
  it("renders a valid PDF buffer for a confirmed event", async () => {
    const event: EventDetail = {
      id: "1",
      enquiryId: "2",
      contactName: "Jane Sample",
      referenceNumber: "QH-000001",
      finalHeadcount: 80,
      confirmedStartsAt: "2027-03-01T10:00:00.000Z",
      confirmedEndsAt: "2027-03-01T14:00:00.000Z",
      bumpInAt: "2027-03-01T08:00:00.000Z",
      bumpOutAt: "2027-03-01T15:00:00.000Z",
      roomSetup: "Banquet, 8 rounds of 10",
      avRequirements: "Lapel mic, projector",
      specialInstructions: "Birthday cake at 12:30pm",
      runSheetNotes: null,
      actualHeadcount: null,
      actualSpend: null,
      completedAt: null,
      spaceNames: ["Main Hall"],
      dietaryRequirements: [{ id: "d1", requirement: "Vegetarian", headcount: 6 }],
    };

    const buffer = await renderPdfToBuffer(RunSheetPdf({ venueName: "The Queens Hotel Gladstone", event }));

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
