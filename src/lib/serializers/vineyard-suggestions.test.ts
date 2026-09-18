import { describe, expect, it } from "vitest";
import { filterVineyardSuggestions, type VineyardListingRow } from "./vineyard-suggestions";

const ME = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

describe("filterVineyardSuggestions -- VIN-5 privacy rule", () => {
  it("includes another user's non-NDA vineyard name", () => {
    const rows: VineyardListingRow[] = [{ vineyard_name: "To Kalon", user_id: OTHER, is_nda: false }];
    expect(filterVineyardSuggestions(rows, ME)).toEqual(["To Kalon"]);
  });

  it("never includes another user's NDA vineyard name", () => {
    const rows: VineyardListingRow[] = [{ vineyard_name: "Zzcanary Block 7", user_id: OTHER, is_nda: true }];
    expect(filterVineyardSuggestions(rows, ME)).toEqual([]);
  });

  it("includes the current user's own vineyard name even if that listing is under NDA", () => {
    const rows: VineyardListingRow[] = [{ vineyard_name: "My Secret Block", user_id: ME, is_nda: true }];
    expect(filterVineyardSuggestions(rows, ME)).toEqual(["My Secret Block"]);
  });

  it("excludes another user's NDA vineyard name for an anonymous/no-viewer caller", () => {
    const rows: VineyardListingRow[] = [{ vineyard_name: "Zzcanary Block 7", user_id: OTHER, is_nda: true }];
    expect(filterVineyardSuggestions(rows, null)).toEqual([]);
  });

  it("de-duplicates repeated names and respects the limit", () => {
    const rows: VineyardListingRow[] = Array.from({ length: 10 }, (_, i) => ({
      vineyard_name: i % 2 === 0 ? "Block A" : "Block B",
      user_id: OTHER,
      is_nda: false,
    }));
    const result = filterVineyardSuggestions(rows, ME, 8);
    expect(result).toEqual(["Block A", "Block B"]);
  });

  it("skips null vineyard names", () => {
    const rows: VineyardListingRow[] = [{ vineyard_name: null, user_id: OTHER, is_nda: false }];
    expect(filterVineyardSuggestions(rows, ME)).toEqual([]);
  });
});
