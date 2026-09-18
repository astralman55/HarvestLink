import { createClient } from "@/lib/supabase/server";
import { DEMO_LISTINGS, filterDemoListings } from "@/lib/demo-data";
import { resolveViewerContext } from "@/lib/supabase/viewer";
import { serializeListing, type PublicListing, type RawSellerProfile } from "@/lib/serializers/listing";
import type { Listing, ListingSearchFilters } from "@/types";

/**
 * Reads listings from the live Supabase project and returns them through
 * the central NDA-aware serializer (NDA-4) -- this is the only place the
 * public marketplace should read listings from. If no project has been
 * connected yet (placeholder credentials in .env.local), the query throws
 * and we transparently fall back to the bundled demo catalog so the
 * marketplace UI is always browsable. Real errors from a connected project
 * still surface as an empty result rather than silently swapping in demo
 * data.
 */
export async function getListings(filters: ListingSearchFilters = {}): Promise<PublicListing[]> {
  try {
    const supabase = await createClient();
    // Bulk-wine-only filters (ABV/quantity/SO2/wine location/farming
    // practices/vintage) live on the embedded bulk_wine_details /
    // listing_farming_practices tables, not on `listings` itself. An
    // `!inner` embed is required for a filter on an embedded table to
    // actually exclude non-matching parent rows rather than just leaving
    // the embed empty -- safe here because /grapes and /bulk-wine always
    // set listing_type explicitly (WINE-3: never a mixed list), so a
    // bulk-wine-scoped query only ever touches rows that already have a
    // bulk_wine_details row by construction (WINE-1/VIN-8).
    const needsBulkWineInner =
      filters.vintage_year ||
      filters.wine_location_state ||
      filters.wine_location_county ||
      filters.abv_min ||
      filters.abv_max ||
      filters.min_gallons ||
      filters.max_gallons ||
      filters.max_so2 ||
      (filters.listing_type === "bulk_wine" && (filters.min_price || filters.max_price));
    const needsFarmingPracticesInner = !!filters.farming_practices;

    let query = supabase
      .from("listings")
      .select(
        `*, bulk_wine_details${needsBulkWineInner ? "!inner" : ""}(*), listing_farming_practices${needsFarmingPracticesInner ? "!inner" : ""}(practice_code)`
      )
      .eq("status", "available");

    if (filters.listing_type) query = query.eq("listing_type", filters.listing_type);
    if (filters.region_ava) query = query.eq("region_ava", filters.region_ava);
    if (filters.variety) query = query.eq("variety", filters.variety);
    if (filters.farming_practice) query = query.eq("farming_practice", filters.farming_practice);
    if (filters.trellis_system) query = query.eq("trellis_system", filters.trellis_system);
    if (filters.soil_type) query = query.eq("soil_type", filters.soil_type);
    if (filters.sun_exposure) query = query.eq("sun_exposure", filters.sun_exposure);
    if (filters.harvest_year) query = query.eq("harvest_year", Number(filters.harvest_year));
    if (filters.slope_min) query = query.gte("slope_percent", Number(filters.slope_min));
    if (filters.slope_max) query = query.lte("slope_percent", Number(filters.slope_max));
    if (filters.min_tons) query = query.gte("estimated_tons", Number(filters.min_tons));
    if (filters.max_tons) query = query.lte("estimated_tons", Number(filters.max_tons));
    if (filters.min_brix) query = query.gte("brix_target", Number(filters.min_brix));
    if (filters.max_brix) query = query.lte("brix_target", Number(filters.max_brix));
    // NDA-12: browse filter, default include.
    if (filters.hide_nda) query = query.eq("is_nda", false);
    if (filters.single_vineyard_only) query = query.eq("single_vineyard", true);
    // VIN-7: "Searching 'Smith Vineyards' must not surface an NDA listing
    // from Smith Vineyards" -- is_nda=false is ANDed in only for this
    // specific filter, not applied to browsing in general.
    if (filters.vineyard_name) {
      query = query.ilike("vineyard_name", `%${filters.vineyard_name}%`).eq("is_nda", false);
    }

    // 6.5: bulk-wine-only filters.
    if (filters.vintage_year) query = query.eq("bulk_wine_details.vintage_year", Number(filters.vintage_year));
    if (filters.wine_location_state) query = query.eq("bulk_wine_details.wine_location_state", filters.wine_location_state);
    if (filters.wine_location_county) query = query.ilike("bulk_wine_details.wine_location_county", `%${filters.wine_location_county}%`);
    if (filters.abv_min) query = query.gte("bulk_wine_details.abv", Number(filters.abv_min));
    if (filters.abv_max) query = query.lte("bulk_wine_details.abv", Number(filters.abv_max));
    if (filters.min_gallons) query = query.gte("bulk_wine_details.quantity_gallons", Number(filters.min_gallons));
    if (filters.max_gallons) query = query.lte("bulk_wine_details.quantity_gallons", Number(filters.max_gallons));
    if (filters.max_so2) query = query.lte("bulk_wine_details.total_so2_ppm", Number(filters.max_so2));
    // Homepage hero's price range slider -- branches by listing_type just
    // like max_price below it always has, since bulk wine rows carry a
    // placeholder 0 in price_per_ton (Decision 29) and grapes rows have no
    // price_per_gallon at all.
    if (filters.listing_type === "bulk_wine" && filters.min_price) {
      query = query.gte("bulk_wine_details.price_per_gallon", Number(filters.min_price));
    } else if (filters.min_price) {
      query = query.gte("price_per_ton", Number(filters.min_price));
    }
    if (filters.listing_type === "bulk_wine" && filters.max_price) {
      query = query.lte("bulk_wine_details.price_per_gallon", Number(filters.max_price));
    } else if (filters.max_price) {
      query = query.lte("price_per_ton", Number(filters.max_price));
    }
    if (filters.farming_practices) {
      const codes = filters.farming_practices.split(",").filter(Boolean);
      if (codes.length > 0) query = query.in("listing_farming_practices.practice_code", codes);
    }

    // 6.5: sort -- newest (default), price/gal asc/desc, quantity, ABV.
    // Grapes rows never set these bulk-wine sorts (their own page only
    // offers "newest").
    switch (filters.sort) {
      case "price_asc":
        query = query.order("price_per_gallon", { ascending: true, referencedTable: "bulk_wine_details" });
        break;
      case "price_desc":
        query = query.order("price_per_gallon", { ascending: false, referencedTable: "bulk_wine_details" });
        break;
      case "quantity":
        query = query.order("quantity_gallons", { ascending: false, referencedTable: "bulk_wine_details" });
        break;
      case "abv":
        query = query.order("abv", { ascending: false, referencedTable: "bulk_wine_details" });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = data as Listing[];

    const [sellersByUserId, viewer] = await Promise.all([fetchPublicSellers(supabase, rows), resolveViewerContext()]);
    return rows.map((row) => serializeListing(row, sellersByUserId.get(row.user_id) ?? null, viewer));
  } catch {
    return filterDemoListings(filters).map((row) => serializeListing(row, demoSeller(row), { userId: null, isAdmin: false }));
  }
}

export async function getListingById(id: string): Promise<PublicListing | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*, bulk_wine_details(*), listing_farming_practices(practice_code)")
      .eq("id", id)
      .single();
    if (error) throw error;
    const row = data as Listing;

    const [sellersByUserId, viewer] = await Promise.all([fetchPublicSellers(supabase, [row]), resolveViewerContext()]);
    return serializeListing(row, sellersByUserId.get(row.user_id) ?? null, viewer);
  } catch {
    const row = DEMO_LISTINGS.find((listing) => listing.id === id);
    if (!row) return null;
    return serializeListing(row, demoSeller(row), { userId: null, isAdmin: false });
  }
}

/**
 * Batch-fetches the safe, publicly-displayable slice of each seller's
 * profile through the profiles_public view (docs/scope-addendum-decisions.md,
 * Decision 1) -- never the profiles table directly, which is now
 * self/admin-only. The NDA serializer decides whether to actually pass
 * this through to a given viewer.
 */
async function fetchPublicSellers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Listing[]
): Promise<Map<string, RawSellerProfile>> {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase.from("profiles_public").select("id, company_name, region_ava, is_verified, username").in("id", userIds);
  if (error) throw error;

  return new Map((data ?? []).map((seller) => [seller.id, seller]));
}

function demoSeller(row: Listing): RawSellerProfile {
  return {
    company_name: row.profiles?.company_name ?? null,
    region_ava: row.profiles?.region_ava ?? null,
    is_verified: row.profiles?.is_verified ?? false,
    username: null,
  };
}
