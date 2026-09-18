import { describe, expect, it } from "vitest";
import { serializeListing } from "./listing";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";
import {
  CANARY_COMPANY,
  CANARY_VINEYARD,
  CANARY_COUNTY,
  CANARY_USER_ID,
  OTHER_USER_ID,
  ADMIN_USER_ID,
  CANARY_SELLER,
  ndaListing,
  bulkWineListing,
  assertNoCanaryLeak,
} from "./canary-fixtures";

/**
 * Section 8.1's mandatory canary test, adapted to the one place this whole
 * feature actually lives: the central serializer (NDA-4). A canary seller
 * with unmistakable unique strings is attached to an NDA listing; every
 * viewer that isn't the owner or an admin must see none of it, in none of
 * the serialized output, ever. This must never be skipped (wired into CI
 * via .github/workflows/test.yml). Fixtures shared with
 * src/lib/listing-metadata.test.ts and src/app/sitemap.test.ts, which
 * extend this same canary to the surfaces Phase 6 added (Decision 40).
 */

describe("serializeListing -- NDA canary", () => {
  it("hides the seller entirely from an anonymous viewer", () => {
    const result = serializeListing(ndaListing(), CANARY_SELLER, { userId: null, isAdmin: false });
    assertNoCanaryLeak(result);
    expect(result.seller).toBeNull();
    expect(result.is_confidential).toBe(true);
  });

  it("hides the seller from a logged-in viewer who isn't the owner", () => {
    const result = serializeListing(ndaListing(), CANARY_SELLER, { userId: OTHER_USER_ID, isAdmin: false });
    assertNoCanaryLeak(result);
    expect(result.seller).toBeNull();
  });

  it("hides the vineyard name and marks it withheld", () => {
    const result = serializeListing(ndaListing(), CANARY_SELLER, { userId: null, isAdmin: false });
    expect(result.vineyard_name).toBeNull();
    expect(result.vineyard_withheld).toBe(true);
  });

  it("hides the sub-AVA (county precision keeps the broader region visible)", () => {
    const result = serializeListing(ndaListing({ nda_location_precision: "county" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    expect(result.sub_ava).toBeNull();
    expect(result.region_ava).toBe("Napa County");
  });

  it("generalizes down to the state when precision is 'state'", () => {
    const result = serializeListing(ndaListing({ nda_location_precision: "state" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    expect(result.sub_ava).toBeNull();
    expect(result.region_ava).toBe("California");
  });

  it("reveals the real seller and vineyard to the owner", () => {
    const result = serializeListing(ndaListing(), CANARY_SELLER, { userId: CANARY_USER_ID, isAdmin: false });
    expect(result.seller?.company_name).toBe(CANARY_COMPANY);
    expect(result.vineyard_name).toBe(CANARY_VINEYARD);
    expect(result.is_confidential).toBe(false);
  });

  it("reveals the real seller to an admin", () => {
    const result = serializeListing(ndaListing(), CANARY_SELLER, { userId: ADMIN_USER_ID, isAdmin: true });
    expect(result.seller?.company_name).toBe(CANARY_COMPANY);
    expect(result.is_confidential).toBe(false);
  });

  it("never includes the seller's internal user_id, even for the owner or admin", () => {
    const owner = serializeListing(ndaListing(), CANARY_SELLER, { userId: CANARY_USER_ID, isAdmin: false });
    const admin = serializeListing(ndaListing(), CANARY_SELLER, { userId: ADMIN_USER_ID, isAdmin: true });
    expect(JSON.stringify(owner)).not.toContain(CANARY_USER_ID);
    expect(JSON.stringify(admin)).not.toContain(CANARY_USER_ID);
  });

  it("never redacts a non-NDA listing", () => {
    const result = serializeListing(ndaListing({ is_nda: false }), CANARY_SELLER, { userId: null, isAdmin: false });
    expect(result.seller?.company_name).toBe(CANARY_COMPANY);
    expect(result.sub_ava).toBe("Atlas Peak");
    expect(result.is_confidential).toBe(false);
  });

  it("computes a per-listing reference number, not a per-seller one", () => {
    const a = serializeListing(ndaListing({ id: "aaaaaaaa-0000-0000-0000-000000000000" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    const b = serializeListing(ndaListing({ id: "bbbbbbbb-0000-0000-0000-000000000000" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    expect(a.reference_number).not.toBe(b.reference_number);
    expect(a.reference_number).toMatch(/^G-[A-F0-9]{5}$/);
  });
});

describe("serializeListing -- bulk wine (WINE-5, acceptance criterion 6.7 'NDA works identically on both types')", () => {
  it("hides wine_location_county from an anonymous viewer under 'state' precision", () => {
    const result = serializeListing(bulkWineListing({ nda_location_precision: "state" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    assertNoCanaryLeak(result);
    expect(result.bulk_wine?.wine_location_county).toBeNull();
    expect(result.bulk_wine?.wine_location_state).toBe("California");
  });

  it("keeps wine_location_county visible under the default 'county' precision", () => {
    const result = serializeListing(bulkWineListing({ nda_location_precision: "county" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    expect(result.bulk_wine?.wine_location_county).toBe(CANARY_COUNTY);
    expect(result.bulk_wine?.wine_location_state).toBe("California");
  });

  it("reveals wine_location_county to the owner regardless of precision", () => {
    const result = serializeListing(bulkWineListing({ nda_location_precision: "state" }), CANARY_SELLER, {
      userId: CANARY_USER_ID,
      isAdmin: false,
    });
    expect(result.bulk_wine?.wine_location_county).toBe(CANARY_COUNTY);
  });

  it("never redacts wine specs (quantity, price, ABV, SO2, vintage, farming practices) -- those are always public", () => {
    const result = serializeListing(bulkWineListing({ nda_location_precision: "state" }), CANARY_SELLER, {
      userId: null,
      isAdmin: false,
    });
    expect(result.bulk_wine?.quantity_gallons).toBe(5000);
    expect(result.bulk_wine?.price_per_gallon).toBe(4.25);
    expect(result.bulk_wine?.abv).toBe(13.5);
    expect(result.bulk_wine?.total_so2_ppm).toBe(80);
    expect(result.bulk_wine?.vintage_year).toBe(2024);
    expect(result.bulk_wine?.farming_practices).toEqual(["organic", "biodynamic"]);
  });

  it("still redacts the seller identity and grape origin exactly like a grapes NDA listing", () => {
    const result = serializeListing(bulkWineListing(), CANARY_SELLER, { userId: null, isAdmin: false });
    expect(result.seller).toBeNull();
    expect(result.is_confidential).toBe(true);
    expect(result.sub_ava).toBeNull();
  });

  it("is null for a listing with no bulk_wine_details (a grapes listing)", () => {
    const result = serializeListing(ndaListing({ is_nda: false }), CANARY_SELLER, { userId: null, isAdmin: false });
    expect(result.bulk_wine).toBeNull();
  });

  it("computes a W- prefixed reference number for bulk wine", () => {
    const result = serializeListing(bulkWineListing(), CANARY_SELLER, { userId: null, isAdmin: false });
    expect(result.reference_number).toMatch(/^W-[A-F0-9]{5}$/);
  });
});

describe("checkFreeTextForNdaLeak -- NDA-6 free-text guard", () => {
  it("blocks the seller's own business name in the description", () => {
    const result = checkFreeTextForNdaLeak({
      text: "Grown by Zzcanary Ridge Vineyards on a steep hillside.",
      companyName: CANARY_COMPANY,
    });
    expect(result.blocked).toBe(true);
  });

  it("blocks case/punctuation variants of the business name", () => {
    const result = checkFreeTextForNdaLeak({
      text: "a block farmed by zz-canary ridge VINEYARDS since 1998",
      companyName: CANARY_COMPANY,
    });
    expect(result.blocked).toBe(true);
  });

  it("blocks the seller's own vineyard name", () => {
    const result = checkFreeTextForNdaLeak({
      text: "Fruit from Zzcanary Block 7, hand-sorted.",
      vineyardNames: [CANARY_VINEYARD],
    });
    expect(result.blocked).toBe(true);
  });

  it("blocks an email address", () => {
    const result = checkFreeTextForNdaLeak({ text: "Reach out at grower@example.com for samples." });
    expect(result.blocked).toBe(true);
  });

  it("blocks a phone number", () => {
    const result = checkFreeTextForNdaLeak({ text: "Call us at (707) 555-1212 to discuss terms." });
    expect(result.blocked).toBe(true);
  });

  it("blocks a website", () => {
    const result = checkFreeTextForNdaLeak({ text: "See more at www.example-vineyards.com" });
    expect(result.blocked).toBe(true);
  });

  it("does not false-positive on an ordinary vineyard description", () => {
    const result = checkFreeTextForNdaLeak({
      text: "South-facing hillside fruit, planted in 1998, dry-farmed with yields around 3.2 tons per acre at 24.5 brix.",
      companyName: CANARY_COMPANY,
      vineyardNames: [CANARY_VINEYARD],
    });
    expect(result.blocked).toBe(false);
  });

  it("allows free text on a listing with no identity fields set", () => {
    const result = checkFreeTextForNdaLeak({ text: "Estate fruit, excellent color and structure." });
    expect(result.blocked).toBe(false);
  });
});
