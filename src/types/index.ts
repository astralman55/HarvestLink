export type UserRole = "grower" | "buyer" | "admin";
export type ListingStatus = "available" | "pending" | "sold" | "archived";
export type CropStatus = "dormant" | "flowering" | "veraison" | "harvested";
export type FarmingPractice = "conventional" | "sustainable" | "organic" | "biodynamic";

// Scope addendum: NDA listings, usernames, vineyard field, bulk wine.
export type ListingType = "grapes" | "bulk_wine";
export type NdaLocationPrecision = "county" | "state";
export type BulkWineFarmingPractice =
  | "organic"
  | "biodynamic"
  | "natural"
  | "sustainable"
  | "regenerative_organic"
  | "demeter_certified_biodynamic";

export interface Profile {
  id: string;
  updated_at: string;
  full_name: string | null;
  company_name: string | null;
  contact_phone: string | null;
  role: UserRole;
  region_ava: string | null;
  address: string | null;
  is_verified: boolean;
  username: string | null;
  username_normalized: string | null;
}

/** Safe, publicly-displayable slice of a profile. See docs/scope-addendum-decisions.md, Decision 1. */
export type PublicProfile = Pick<Profile, "id" | "company_name" | "region_ava" | "is_verified" | "username">;

export interface BulkWineDetails {
  listing_id: string;
  quantity_gallons: number;
  price_per_gallon: number;
  abv: number;
  total_so2_ppm: number | null;
  vintage_year: number | null;
  is_multi_vintage: boolean;
  wine_location_state: string | null;
  wine_location_county: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
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
  status: ListingStatus;
  farming_practice: FarmingPractice;
  trellis_system: string | null;
  soil_type: string | null;
  sun_exposure: string | null;
  slope_percent: number | null;
  harvest_year: number;
  created_at: string;
  listing_type: ListingType;
  is_nda: boolean;
  nda_location_precision: NdaLocationPrecision;
  single_vineyard: boolean;
  vineyard_name: string | null;
  vineyard_name_normalized: string | null;
  profiles?: Pick<Profile, "company_name" | "region_ava" | "is_verified">;
  bulk_wine_details?: BulkWineDetails | null;
  /** Raw join rows as PostgREST embeds them: [{ practice_code: "organic" }, ...]. */
  listing_farming_practices?: { practice_code: BulkWineFarmingPractice }[];
}

export interface CropPlan {
  id: string;
  user_id: string;
  harvest_year: number;
  variety: string;
  block_identifier: string | null;
  projected_tons: number;
  current_status: CropStatus;
  buyer_aligned_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ListingSearchFilters {
  region_ava?: string;
  variety?: string;
  farming_practice?: string;
  trellis_system?: string;
  soil_type?: string;
  sun_exposure?: string;
  harvest_year?: string;
  slope_min?: string;
  slope_max?: string;
  min_tons?: string;
  max_price?: string;
  min_brix?: string;
  /** NDA-12: browse filter to exclude NDA listings. Default (unset) is include. */
  hide_nda?: string;
  /** VIN-7: matches non-NDA listings' vineyard names only -- see getListings(). */
  vineyard_name?: string;
  single_vineyard_only?: string;

  // WINE-2/6.5: /grapes and /bulk-wine always set this explicitly so the
  // two sections never show a mixed list (WINE-3). Typed as a plain string
  // (not ListingType) so it fits the generic string-keyed filter-patch
  // pattern the rest of this interface and FilterPanel.tsx use.
  listing_type?: string;

  // 6.5: bulk-wine-only browse filters.
  vintage_year?: string;
  wine_location_state?: string;
  wine_location_county?: string;
  abv_min?: string;
  abv_max?: string;
  min_gallons?: string;
  max_gallons?: string;
  max_so2?: string;
  /** Comma-separated BulkWineFarmingPractice codes, matched "any of" (WINE-6). */
  farming_practices?: string;

  /** "newest" (default) | "price_asc" | "price_desc" | "quantity" | "abv" */
  sort?: string;
}
