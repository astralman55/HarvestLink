import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serializeListing, type ViewerContext } from "@/lib/serializers/listing";
import type { Listing } from "@/types";

/**
 * Server-side reads of the identifying listing columns (user_id,
 * vineyard_name, sub_ava, region_ava, title, wine_location_county) that
 * migration 0008 took away from the public API roles (Decision 46). Every
 * function here uses the service role, so each one takes a `userId` that the
 * CALLER must have taken from `supabase.auth.getUser()` -- never from client
 * input -- and scopes the query to it.
 */

/** One listing plus its children, only if `userId` owns it. */
export async function getOwnedListingRow(userId: string, listingId: string): Promise<Listing | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select("*, bulk_wine_details(*), listing_farming_practices(practice_code)")
    .eq("id", listingId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Listing;
}

/** Cheap ownership check for update/delete paths (optionally pinned to a listing type). */
export async function userOwnsListing(userId: string, listingId: string, listingType?: Listing["listing_type"]): Promise<boolean> {
  const admin = createAdminClient();
  let query = admin.from("listings").select("id").eq("id", listingId).eq("user_id", userId);
  if (listingType) query = query.eq("listing_type", listingType);
  const { data } = await query.maybeSingle();
  return !!data;
}

export async function getOwnListings(userId: string): Promise<Listing[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("listings")
    .select("*, bulk_wine_details(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Listing[]) ?? [];
}

export async function countOwnListings(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin.from("listings").select("id", { count: "exact", head: true }).eq("user_id", userId);
  return count ?? 0;
}

/** Vineyard names on the seller's own listings, for the NDA free-text guard. */
export async function getOwnVineyardNames(userId: string): Promise<(string | null)[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("listings").select("vineyard_name").eq("user_id", userId);
  return (data ?? []).map((row) => row.vineyard_name as string | null);
}

/**
 * Titles a given viewer is allowed to see, keyed by listing id -- the
 * stored title of a confidential listing can carry the sub-appellation the
 * seller hid, so anything outside the listing's own pages (the inquiry
 * inbox, notification emails) must get it from the serializer, not from the
 * raw column.
 */
export async function getListingTitlesForViewer(
  listingIds: string[],
  viewer: ViewerContext
): Promise<Map<string, { title: string; isNda: boolean }>> {
  const ids = [...new Set(listingIds)];
  if (ids.length === 0) return new Map();
  const admin = createAdminClient();
  const { data } = await admin.from("listings").select("*, bulk_wine_details(*)").in("id", ids);
  return new Map(
    ((data ?? []) as Listing[]).map((row) => [row.id, { title: serializeListing(row, null, viewer).title, isNda: row.is_nda }])
  );
}
