import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv/export";

describe("toCsv", () => {
  it("quotes cells containing commas, quotes, or newlines", () => {
    const csv = toCsv(
      [{ name: 'Smith, "The" Wedding\nParty', note: "plain" }],
      [
        { key: "name", header: "Name" },
        { key: "note", header: "Note" },
      ]
    );
    expect(csv).toBe('Name,Note\r\n"Smith, ""The"" Wedding\nParty",plain');
  });

  it("renders null/undefined as an empty cell", () => {
    const csv = toCsv([{ a: null, b: undefined }], [
      { key: "a", header: "A" },
      { key: "b", header: "B" },
    ]);
    expect(csv).toBe("A,B\r\n,");
  });
});
