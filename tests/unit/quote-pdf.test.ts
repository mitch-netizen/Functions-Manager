import { describe, it, expect } from "vitest";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { QuotePdf } from "@/lib/pdf/quote-template";
import { resolveBrand } from "@/lib/email/templates/brand";

describe("QuotePdf rendering", () => {
  it("renders a valid PDF buffer for a quote with line items", async () => {
    const buffer = await renderPdfToBuffer(
      QuotePdf({
        brand: resolveBrand("The Queens Hotel Gladstone", {}),
        legalEntityName: null,
        venueAddress: "125 Goondoon Street, Gladstone",
        abn: null,
        referenceNumber: "QH-000001",
        contactName: "Jane Sample",
        version: 1,
        lineItems: [
          { id: "1", description: "Set menu", quantity: 50, unitPrice: 85, lineTotal: 4250, packageId: null },
          { id: "2", description: "Beverage package", quantity: 50, unitPrice: 45, lineTotal: 2250, packageId: null },
        ],
        subtotal: 6500,
        gstAmount: 650,
        total: 7150,
        minimumSpendApplied: null,
        validUntil: "2027-01-01",
      })
    );

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
