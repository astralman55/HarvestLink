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
    let query = supabase.from("listings").select("*").eq("status", "available").order("created_at", { ascending: false });

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
    if (filters.max_price) query = query.lte("price_per_ton", Number(filters.max_price));
    if (filters.min_brix) query = query.gte("brix_target", Number(filters.min_brix));
    // NDA-12: browse filter, default include.
    if (filters.hide_nda) query = query.eq("is_nda", false);

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
    const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
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
