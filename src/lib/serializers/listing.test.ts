import { describe, expect, it } from "vitest";
import { serializeListing, type RawSellerProfile } from "./listing";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";
import type { Listing } from "@/types";

/**
 * Section 8.1's mandatory canary test, adapted to the one place this whole
 * feature actually lives: the central serializer (NDA-4). A canary seller
 * with unmistakable unique strings is attached to an NDA listing; every
 * viewer that isn't the owner or an admin must see none of it, in none of
 * the serialized output, ever. This must never be skipped (wired into CI
 * via .github/workflows/test.yml).
 */

const CANARY_COMPANY = "Zzcanary Ridge Vineyards";
const CANARY_USERNAME = "zzcanary_seller";
const CANARY_VINEYARD = "Zzcanary Block 7";
const CANARY_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const ADMIN_USER_ID = "33333333-3333-3333-3333-333333333333";

const CANARY_SELLER: RawSellerProfile = {
  company_name: CANARY_COMPANY,
  region_ava: "Napa Valley",
  is_verified: true,
  username: CANARY_USERNAME,
};

function ndaListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    user_id: CANARY_USER_ID,
    title: "Cabernet Sauvignon (Clone 337) — Napa Valley",
    variety: "Cabernet Sauvignon",
    clone: "Clone 337",
    rootstock: "110R",
    region_ava: "Napa Valley",
    sub_ava: "Atlas Peak",
    estimated_tons: 20,
    minimum_tons: 2,
    price_per_ton: 4000,
    brix_target: 25,
    description: "South-facing hillside block, hand-sorted at harvest.",
    status: "available",
    farming_practice: "sustainable",
    trellis_system: "VSP",
    soil_type: "Volcanic",
    sun_exposure: "South",
    slope_percent: 10,
    harvest_year: 2027,
    created_at: new Date().toISOString(),
    listing_type: "grapes",
    is_nda: true,
    nda_location_precision: "county",
    single_vineyard: true,
    vineyard_name: CANARY_VINEYARD,
    vineyard_name_normalized: "zzcanaryblock7",
    ...overrides,
  };
}

function assertNoCanaryLeak(publicListing: unknown) {
  const json = JSON.stringify(publicListing);
  expect(json).not.toContain(CANARY_COMPANY);
  expect(json).not.toContain(CANARY_USERNAME);
  expect(json).not.toContain(CANARY_VINEYARD);
  expect(json).not.toContain(CANARY_USER_ID);
}

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
    expect(result.region_ava).toBe("Napa Valley");
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
