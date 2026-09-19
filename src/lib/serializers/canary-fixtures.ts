import { serializeListing, type RawSellerProfile, type PublicListing } from "./listing";
import type { Listing } from "@/types";

/**
 * Shared fixture for Section 8.1's mandatory NDA canary test. Every surface
 * that reads listing data -- the serializer itself, per-listing metadata,
 * the sitemap, and anything added later -- gets tested against this same
 * seller/listing so there's exactly one place that defines what "the canary
 * strings" are (docs/scope-addendum-decisions.md, Decision 19).
 */
export const CANARY_COMPANY = "Zzcanary Ridge Vineyards";
export const CANARY_USERNAME = "zzcanary_seller";
export const CANARY_VINEYARD = "Zzcanary Block 7";
export const CANARY_COUNTY = "Zzcanary County";
export const CANARY_AREA = "Zzcanary Hillside";
export const CANARY_WINEMAKER = "Zzcanary Winemaker";
export const CANARY_USER_ID = "11111111-1111-1111-1111-111111111111";
export const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
export const ADMIN_USER_ID = "33333333-3333-3333-3333-333333333333";

export const CANARY_STRINGS = [
  CANARY_COMPANY,
  CANARY_USERNAME,
  CANARY_VINEYARD,
  CANARY_COUNTY,
  CANARY_AREA,
  CANARY_WINEMAKER,
  CANARY_USER_ID,
];

export const CANARY_SELLER: RawSellerProfile = {
  company_name: CANARY_COMPANY,
  region_ava: "Napa County",
  is_verified: true,
  username: CANARY_USERNAME,
};

export function ndaListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    user_id: CANARY_USER_ID,
    // Real stored titles are built from sub_ava || region_ava, so this
    // carries the canary area exactly like a saved listing's would.
    title: `Cabernet Sauvignon (Clone 337) — ${CANARY_AREA}`,
    variety: "Cabernet Sauvignon",
    clone: "Clone 337",
    rootstock: "110R",
    region_ava: "Napa County",
    sub_ava: CANARY_AREA,
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

export function bulkWineListing(overrides: Partial<Listing> = {}): Listing {
  return ndaListing({
    listing_type: "bulk_wine",
    single_vineyard: false,
    vineyard_name: null,
    vineyard_name_normalized: null,
    bulk_wine_details: {
      listing_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      quantity_gallons: 5000,
      price_per_gallon: 4.25,
      abv: 13.5,
      total_so2_ppm: 80,
      vintage_year: 2024,
      is_multi_vintage: false,
      wine_location_state: "California",
      wine_location_county: CANARY_COUNTY,
      winemaker_name: CANARY_WINEMAKER,
      created_at: new Date().toISOString(),
    },
    listing_farming_practices: [{ practice_code: "organic" }, { practice_code: "biodynamic" }],
    ...overrides,
  });
}

export function assertNoCanaryLeak(publicListing: unknown) {
  const json = JSON.stringify(publicListing);
  for (const canary of CANARY_STRINGS) {
    if (json.includes(canary)) {
      throw new Error(`Canary leak: "${canary}" found in serialized output`);
    }
  }
}

/** A ready-made anonymous-viewer serialization of the NDA grapes canary listing. */
export function anonymousCanaryGrapes(overrides: Partial<Listing> = {}): PublicListing {
  return serializeListing(ndaListing(overrides), CANARY_SELLER, { userId: null, isAdmin: false });
}

/** A ready-made anonymous-viewer serialization of the NDA bulk-wine canary listing. */
export function anonymousCanaryBulkWine(overrides: Partial<Listing> = {}): PublicListing {
  return serializeListing(bulkWineListing(overrides), CANARY_SELLER, { userId: null, isAdmin: false });
}
