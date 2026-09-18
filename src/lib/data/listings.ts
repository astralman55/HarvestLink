import { createClient } from "@/lib/supabase/server";
import { DEMO_LISTINGS, filterDemoListings } from "@/lib/demo-data";
import type { Listing, ListingSearchFilters } from "@/types";

/**
 * Reads listings from the live Supabase project. If no project has been
 * connected yet (placeholder credentials in .env.local), the query throws
 * and we transparently fall back to the bundled demo catalog so the
 * marketplace UI is always browsable. Real errors from a connected project
 * still surface as an empty result rather than silently swapping in demo
 * data.
 */
export async function getListings(filters: ListingSearchFilters = {}): Promise<Listing[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select("*, profiles(company_name, region_ava, is_verified)")
      .eq("status", "available")
      .order("created_at", { ascending: false });

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

    const { data, error } = await query;
    if (error) throw error;
    return data as Listing[];
  } catch {
    return filterDemoListings(filters);
  }
}

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*, profiles(company_name, region_ava, is_verified)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Listing;
  } catch {
    return DEMO_LISTINGS.find((listing) => listing.id === id) ?? null;
  }
}
