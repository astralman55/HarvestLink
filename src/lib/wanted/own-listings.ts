import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListingTitlesForViewer } from "@/lib/data/owner-listings";
import type { WantedType } from "@/lib/wanted/schema";

export interface OwnLotOption {
  id: string;
  label: string;
  isNda: boolean;
}

/** The member's own available lots of one type, labelled for them, so they can offer one against a request. */
export async function getOwnAvailableLots(userId: string, type: WantedType): Promise<OwnLotOption[]> {
  try {
    const { data } = await createAdminClient()
      .from("listings")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_type", type)
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(50);
    const ids = (data ?? []).map((row: { id: string }) => row.id);
    if (ids.length === 0) return [];
    // The owner is the viewer, so they see their own lots' real titles.
    const titles = await getListingTitlesForViewer(ids, { userId, isAdmin: false });
    return ids.map((id) => ({ id, label: titles.get(id)?.title ?? "Listing", isNda: titles.get(id)?.isNda ?? false }));
  } catch {
    return [];
  }
}
