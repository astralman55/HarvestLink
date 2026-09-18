import { getStateForRegion } from "@/lib/constants/viticulture";
import type { BulkWineFarmingPractice, Listing, PublicProfile } from "@/types";

/**
 * NDA-4: the one central public-listing serializer every surface must go
 * through (pages, cards, the realtime broadcast trigger's SQL is the one
 * DB-level exception, documented in migration 0005). Takes a raw listing
 * row plus a viewer context and returns only the fields that viewer is
 * allowed to see. Do not scatter `if (listing.is_nda)` checks elsewhere --
 * route new surfaces through this function instead.
 */
export interface ViewerContext {
  userId: string | null;
  isAdmin: boolean;
}

export const ANONYMOUS_VIEWER: ViewerContext = { userId: null, isAdmin: false };

export type RawSellerProfile = Omit<PublicProfile, "id">;
export type PublicSeller = RawSellerProfile;

export interface PublicBulkWineDetails {
  quantity_gallons: number;
  price_per_gallon: number;
  abv: number;
  total_so2_ppm: number | null;
  vintage_year: number | null;
  is_multi_vintage: boolean;
  /** Always shown down to nda_location_precision -- see WINE-5/NDA-3. */
  wine_location_state: string | null;
  /** Hidden under NDA unless nda_location_precision is "county". */
  wine_location_county: string | null;
  farming_practices: BulkWineFarmingPractice[];
}

export interface PublicListing {
  id: string;
  /** Safe, non-correlating display id (NDA-9) -- never the seller's user_id. */
  reference_number: string;
  title: string;
  listing_type: Listing["listing_type"];
  variety: string;
  clone: string | null;
  rootstock: string | null;
  region_ava: string;
  sub_ava: string | null;
  estimated_tons: number;
  minimum_tons: number;
  price_per_ton: number;
  brix_target: number | null;
  description: string | null;
  status: Listing["status"];
  farming_practice: Listing["farming_practice"];
  trellis_system: string | null;
  soil_type: string | null;
  sun_exposure: string | null;
  slope_percent: number | null;
  harvest_year: number;
  created_at: string;
  is_nda: boolean;
  single_vineyard: boolean;
  vineyard_name: string | null;
  /** true when single_vineyard but the name is withheld -- UI shows "Single vineyard (name withheld)". */
  vineyard_withheld: boolean;
  /** null when the seller's identity is withheld from this viewer (UI shows "Confidential Seller"). */
  seller: PublicSeller | null;
  is_confidential: boolean;
  /** For UI decisions only (e.g. hiding "inquire" on your own listing) -- never the raw user_id. */
  viewer_is_owner: boolean;
  /** Only present when listing_type is "bulk_wine". */
  bulk_wine: PublicBulkWineDetails | null;
}

function computeReferenceNumber(id: string, listingType: Listing["listing_type"]): string {
  const prefix = listingType === "bulk_wine" ? "W" : "G";
  const hex = id.replace(/-/g, "").slice(0, 5).toUpperCase();
  return `${prefix}-${hex}`;
}

export function serializeListing(row: Listing, seller: RawSellerProfile | null, viewer: ViewerContext): PublicListing {
  const isOwner = viewer.userId != null && viewer.userId === row.user_id;
  const revealIdentity = !row.is_nda || isOwner || viewer.isAdmin;

  // NDA-3/WINE-5: sub_ava is always the more identifying detail; "state"
  // precision additionally generalizes region_ava itself. Grapes has no
  // county/state columns of its own, so "county" precision maps to "show
  // the AVA region, hide the sub-AVA" and "state" maps to "show only the
  // state the AVA sits in" (docs/scope-addendum-decisions.md). For bulk
  // wine, region_ava/sub_ava is "grape origin" (WINE-4), redacted the same
  // way; wine_location (a separate field, below) gets its own, more
  // literal county/state redaction since it actually has those columns.
  let region_ava = row.region_ava;
  let sub_ava = row.sub_ava;
  if (row.is_nda && !revealIdentity) {
    sub_ava = null;
    if (row.nda_location_precision === "state") {
      region_ava = getStateForRegion(row.region_ava) ?? row.region_ava;
    }
  }

  const isConfidential = row.is_nda && !revealIdentity;
  const vineyardWithheld = isConfidential && row.single_vineyard;

  const rawBulkWine = row.bulk_wine_details;
  const bulkWine: PublicBulkWineDetails | null = rawBulkWine
    ? {
        quantity_gallons: rawBulkWine.quantity_gallons,
        price_per_gallon: rawBulkWine.price_per_gallon,
        abv: rawBulkWine.abv,
        total_so2_ppm: rawBulkWine.total_so2_ppm,
        vintage_year: rawBulkWine.vintage_year,
        is_multi_vintage: rawBulkWine.is_multi_vintage,
        wine_location_state: rawBulkWine.wine_location_state,
        // Unlike grapes' sub_ava (always hidden -- it's more specific than
        // the "county" tier even means there), wine_location_county IS the
        // literal county-precision tier, so it's only hidden when the
        // seller chose the more-restrictive "state" precision, not for
        // "county" precision (the default).
        wine_location_county: isConfidential && row.nda_location_precision === "state" ? null : rawBulkWine.wine_location_county,
        farming_practices: (row.listing_farming_practices ?? []).map((p) => p.practice_code),
      }
    : null;

  return {
    id: row.id,
    reference_number: computeReferenceNumber(row.id, row.listing_type),
    title: row.title,
    listing_type: row.listing_type,
    variety: row.variety,
    clone: row.clone,
    rootstock: row.rootstock,
    region_ava,
    sub_ava,
    estimated_tons: row.estimated_tons,
    minimum_tons: row.minimum_tons,
    price_per_ton: row.price_per_ton,
    brix_target: row.brix_target,
    description: row.description,
    status: row.status,
    farming_practice: row.farming_practice,
    trellis_system: row.trellis_system,
    soil_type: row.soil_type,
    sun_exposure: row.sun_exposure,
    slope_percent: row.slope_percent,
    harvest_year: row.harvest_year,
    created_at: row.created_at,
    is_nda: row.is_nda,
    single_vineyard: row.single_vineyard,
    vineyard_name: vineyardWithheld ? null : row.vineyard_name,
    vineyard_withheld: vineyardWithheld,
    seller: isConfidential || !seller ? null : seller,
    is_confidential: isConfidential,
    viewer_is_owner: isOwner,
    bulk_wine: bulkWine,
  };
}
