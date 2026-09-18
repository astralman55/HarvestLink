import type { Listing, ListingSearchFilters } from "@/types";

/**
 * Sample catalog used only when no live Supabase project is configured yet
 * (see src/lib/data/listings.ts). Lets the marketplace UI be fully browsable
 * and filterable out of the box; swapped out automatically once real
 * NEXT_PUBLIC_SUPABASE_URL / ANON_KEY values are set.
 */
// Scope addendum fields all demo listings share: plain grapes, no NDA, no
// single-vineyard designation. Spread first in each entry below so a
// per-listing override (none needed yet) could still shadow it.
const DEMO_LISTING_DEFAULTS = {
  listing_type: "grapes" as const,
  is_nda: false,
  nda_location_precision: "county" as const,
  single_vineyard: false,
  vineyard_name: null,
  vineyard_name_normalized: null,
};

export const DEMO_LISTINGS: Listing[] = [
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-1",
    user_id: "demo-grower-1",
    title: "Estate Cabernet Sauvignon — Hillside Block",
    variety: "Cabernet Sauvignon",
    clone: "Clone 337",
    rootstock: "110R",
    region_ava: "Napa Valley",
    sub_ava: "Atlas Peak",
    estimated_tons: 42,
    minimum_tons: 5,
    price_per_ton: 6800,
    brix_target: 25.5,
    description:
      "South-facing hillside fruit with concentrated tannin structure. Consistent 20+ year producing block, hand-sorted at harvest.",
    status: "available",
    farming_practice: "sustainable",
    trellis_system: "Vertical Shoot Positioning (VSP)",
    soil_type: "Volcanic",
    sun_exposure: "South",
    slope_percent: 12,
    harvest_year: new Date().getFullYear() + 1,
    created_at: new Date().toISOString(),
    profiles: { company_name: "Stagecoach Ridge Vineyards", region_ava: "Napa Valley", is_verified: true },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-2",
    user_id: "demo-grower-2",
    title: "Certified Organic Chardonnay — Coastal Bench",
    variety: "Chardonnay",
    clone: "Dijon 96",
    rootstock: "3309C",
    region_ava: "Sonoma Coast",
    sub_ava: "Fort Ross-Seaview",
    estimated_tons: 28,
    minimum_tons: 3,
    price_per_ton: 3400,
    brix_target: 23,
    description:
      "Cool-climate, fog-influenced fruit with bright acidity. CCOF certified organic since 2016. Ideal for sparkling or barrel-fermented programs.",
    status: "available",
    farming_practice: "organic",
    trellis_system: "Scott Henry",
    soil_type: "Sandy Loam",
    sun_exposure: "Southwest",
    slope_percent: 6,
    harvest_year: new Date().getFullYear() + 1,
    created_at: new Date().toISOString(),
    profiles: { company_name: "Bodega Bay Growers Co.", region_ava: "Sonoma Coast", is_verified: true },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-3",
    user_id: "demo-grower-3",
    title: "Biodynamic Pinot Noir — Estate Block 4",
    variety: "Pinot Noir",
    clone: "Pommard",
    rootstock: "101-14",
    region_ava: "Willamette Valley",
    sub_ava: "Dundee Hills",
    estimated_tons: 15,
    minimum_tons: 2,
    price_per_ton: 5200,
    brix_target: 24,
    description:
      "Demeter-certified biodynamic estate, dry-farmed. Small cluster, low-vigor block prized for structured, age-worthy wines.",
    status: "available",
    farming_practice: "biodynamic",
    trellis_system: "Guyot",
    soil_type: "Volcanic",
    sun_exposure: "Southeast",
    slope_percent: 9,
    harvest_year: new Date().getFullYear(),
    created_at: new Date().toISOString(),
    profiles: { company_name: "Chehalem Ridge Farms", region_ava: "Willamette Valley", is_verified: true },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-4",
    user_id: "demo-grower-4",
    title: "Paso Robles Zinfandel — Dry-Farmed Old Vine",
    variety: "Zinfandel",
    clone: "Original Field Selection",
    rootstock: "St. George",
    region_ava: "Paso Robles",
    sub_ava: null,
    estimated_tons: 18,
    minimum_tons: 2,
    price_per_ton: 2600,
    brix_target: 26,
    description:
      "Head-trained old vine block planted 1978. Dry-farmed, low yields, deeply concentrated fruit.",
    status: "available",
    farming_practice: "conventional",
    trellis_system: "Head-Trained / Gobelet",
    soil_type: "Rocky / Shallow",
    sun_exposure: "West",
    slope_percent: 4,
    harvest_year: new Date().getFullYear(),
    created_at: new Date().toISOString(),
    profiles: { company_name: "Adelaida Bench Vineyards", region_ava: "Paso Robles", is_verified: false },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-5",
    user_id: "demo-grower-5",
    title: "Columbia Valley Syrah — Sustainable Block",
    variety: "Syrah",
    clone: "Estrella River",
    rootstock: "1103P",
    region_ava: "Columbia Valley",
    sub_ava: null,
    estimated_tons: 34,
    minimum_tons: 5,
    price_per_ton: 2100,
    brix_target: 25,
    description:
      "LIVE-certified sustainable vineyard. Warm days and cool nights produce peppery, structured Syrah with excellent color extraction.",
    status: "available",
    farming_practice: "sustainable",
    trellis_system: "Geneva Double Curtain (GDC)",
    soil_type: "Gravelly",
    sun_exposure: "South",
    slope_percent: 3,
    harvest_year: new Date().getFullYear() + 1,
    created_at: new Date().toISOString(),
    profiles: { company_name: "Horse Heaven Growers", region_ava: "Columbia Valley", is_verified: true },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-6",
    user_id: "demo-grower-6",
    title: "Sauvignon Blanc — Estate Coastal Fruit",
    variety: "Sauvignon Blanc",
    clone: "Musque",
    rootstock: "SO4",
    region_ava: "Santa Ynez Valley",
    sub_ava: "Sta. Rita Hills",
    estimated_tons: 22,
    minimum_tons: 3,
    price_per_ton: 2200,
    brix_target: 22,
    description:
      "Bright, aromatic fruit from a wind-swept coastal bench. Excellent tropical and citrus character for early-drinking programs.",
    status: "available",
    farming_practice: "sustainable",
    trellis_system: "Vertical Shoot Positioning (VSP)",
    soil_type: "Sandy Loam",
    sun_exposure: "Southwest",
    slope_percent: 2,
    harvest_year: new Date().getFullYear(),
    created_at: new Date().toISOString(),
    profiles: { company_name: "Sta. Rita Hills Farming Co.", region_ava: "Santa Ynez Valley", is_verified: true },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-7",
    user_id: "demo-grower-7",
    title: "Estate Riesling — Steep Shale Slope",
    variety: "Riesling",
    clone: "FPS 24",
    rootstock: "3309C",
    region_ava: "Finger Lakes",
    sub_ava: "Seneca Lake",
    estimated_tons: 12,
    minimum_tons: 1,
    price_per_ton: 1850,
    brix_target: 20,
    description:
      "Steep lakeside slope with excellent air drainage. Petrol-driven minerality, high natural acid retention.",
    status: "available",
    farming_practice: "organic",
    trellis_system: "Scott Henry",
    soil_type: "Limestone",
    sun_exposure: "East",
    slope_percent: 22,
    harvest_year: new Date().getFullYear(),
    created_at: new Date().toISOString(),
    profiles: { company_name: "Seneca Bluff Vineyards", region_ava: "Finger Lakes", is_verified: false },
  },
  {
    ...DEMO_LISTING_DEFAULTS,
    id: "demo-8",
    user_id: "demo-grower-8",
    title: "Red Mountain Malbec — Forward Contract Ready",
    variety: "Malbec",
    clone: "Clone 4",
    rootstock: "1103P",
    region_ava: "Yakima Valley",
    sub_ava: "Red Mountain",
    estimated_tons: 26,
    minimum_tons: 4,
    price_per_ton: 2450,
    brix_target: 25.5,
    description:
      "Desert climate block on classic Red Mountain slope. Deep color, ripe tannin — available for multi-year forward contracts.",
    status: "available",
    farming_practice: "conventional",
    trellis_system: "Smart-Dyson",
    soil_type: "Granite",
    sun_exposure: "Southeast",
    slope_percent: 14,
    harvest_year: new Date().getFullYear() + 2,
    created_at: new Date().toISOString(),
    profiles: { company_name: "Kiona Ridge Farms", region_ava: "Yakima Valley", is_verified: true },
  },
];

export function filterDemoListings(filters: ListingSearchFilters): Listing[] {
  return DEMO_LISTINGS.filter((listing) => {
    if (filters.hide_nda && listing.is_nda) return false;
    if (filters.single_vineyard_only && !listing.single_vineyard) return false;
    if (
      filters.vineyard_name &&
      (listing.is_nda || !listing.vineyard_name?.toLowerCase().includes(filters.vineyard_name.toLowerCase()))
    )
      return false;
    if (filters.region_ava && listing.region_ava !== filters.region_ava) return false;
    if (filters.variety && listing.variety !== filters.variety) return false;
    if (filters.farming_practice && listing.farming_practice !== filters.farming_practice) return false;
    if (filters.trellis_system && listing.trellis_system !== filters.trellis_system) return false;
    if (filters.soil_type && listing.soil_type !== filters.soil_type) return false;
    if (filters.sun_exposure && listing.sun_exposure !== filters.sun_exposure) return false;
    if (filters.harvest_year && String(listing.harvest_year) !== filters.harvest_year) return false;
    if (filters.slope_min && (listing.slope_percent ?? 0) < Number(filters.slope_min)) return false;
    if (filters.slope_max && (listing.slope_percent ?? 0) > Number(filters.slope_max)) return false;
    if (filters.min_tons && listing.estimated_tons < Number(filters.min_tons)) return false;
    if (filters.max_price && listing.price_per_ton > Number(filters.max_price)) return false;
    if (filters.min_brix && (listing.brix_target ?? 0) < Number(filters.min_brix)) return false;
    return true;
  });
}
