"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateBulkWineListingSchema, type CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";
import { generateBulkWineTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";
import { normalizeWinemakerName } from "@/lib/validation/winemaker";
import { getOwnVineyardNames, userOwnsListing } from "@/lib/data/owner-listings";

export async function updateBulkWineListing(listingId: string, data: CreateBulkWineListingInput) {
  const validation = CreateBulkWineListingSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Invalid payload inputs." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized access token context." };

    // Ownership is checked up front with the service role (the API roles can no
    // longer read listings.user_id / listing_type -- migration 0008); the
    // updates below are scoped to the id alone and the RLS policies stay as
    // the second lock.
    if (!(await userOwnsListing(user.id, listingId, "bulk_wine"))) {
      return { error: "Listing not found, or you don't have permission to edit it." };
    }

    const vineyardName = validation.data.single_vineyard ? validation.data.vineyard_name?.trim() || null : null;
    const vintageYear = validation.data.is_multi_vintage ? null : validation.data.vintage_year ?? null;
    const winemakerName = normalizeWinemakerName(validation.data.winemaker_name);

    if (validation.data.is_nda) {
      const [{ data: profile }, otherVineyards, { data: otherWinemakers }] = await Promise.all([
        supabase.from("profiles").select("username, company_name, full_name").eq("id", user.id).single(),
        getOwnVineyardNames(user.id),
        // Owner-only table, so this is just the seller's own winemakers.
        supabase.from("listing_winemakers").select("winemaker_name").limit(200),
      ]);
      const guard = checkFreeTextForNdaLeak({
        text: validation.data.description,
        companyName: profile?.company_name,
        fullName: profile?.full_name,
        username: profile?.username,
        // Same reasoning as the create action: a winemaker is as identifying
        // as a vineyard name, so the description can't name one either.
        vineyardNames: [
          vineyardName,
          winemakerName,
          ...otherVineyards,
          ...(otherWinemakers ?? []).map((w) => w.winemaker_name),
        ],
      });
      if (guard.blocked) return { error: guard.reason };
    }

    const { data: updated, error: listingError } = await supabase
      .from("listings")
      .update({
        variety: validation.data.variety,
        region_ava: validation.data.region_ava,
        sub_ava: validation.data.sub_ava || null,
        description: validation.data.description,
        status: validation.data.status,
        is_nda: validation.data.is_nda,
        nda_location_precision: validation.data.nda_location_precision,
        single_vineyard: validation.data.single_vineyard,
        vineyard_name: vineyardName,
        harvest_year: vintageYear ?? new Date().getFullYear(),
        title: generateBulkWineTitle(
          validation.data.variety,
          vintageYear ?? undefined,
          validation.data.is_multi_vintage,
          validation.data.sub_ava || validation.data.region_ava
        ),
      })
      .eq("id", listingId)
      .select("id");

    if (listingError) return { error: listingError.message };
    if (!updated || updated.length === 0) {
      return { error: "Listing not found, or you don't have permission to edit it." };
    }

    const { error: detailsError } = await supabase
      .from("bulk_wine_details")
      .update({
        quantity_gallons: validation.data.quantity_gallons,
        price_per_gallon: validation.data.price_per_gallon,
        abv: validation.data.abv,
        total_so2_ppm: validation.data.total_so2_ppm ?? null,
        vintage_year: vintageYear,
        is_multi_vintage: validation.data.is_multi_vintage,
        wine_location_state: validation.data.wine_location_state ?? null,
        wine_location_county: validation.data.wine_location_county ?? null,
      })
      .eq("listing_id", listingId);
    if (detailsError) return { error: detailsError.message };

    // Winemaker lives in its own owner/admin-only table (migration 0007).
    if (winemakerName) {
      const { error: winemakerError } = await supabase
        .from("listing_winemakers")
        .upsert({ listing_id: listingId, winemaker_name: winemakerName }, { onConflict: "listing_id" });
      if (winemakerError) return { error: winemakerError.message };
    } else {
      // Cleared (or never set): remove any row. The result is deliberately
      // ignored -- if migration 0007 hasn't been run there's nothing to remove.
      await supabase.from("listing_winemakers").delete().eq("listing_id", listingId);
    }

    // Simplest correct way to reconcile a multi-select: replace the whole set.
    const { error: deletePracticesError } = await supabase
      .from("listing_farming_practices")
      .delete()
      .eq("listing_id", listingId);
    if (deletePracticesError) return { error: deletePracticesError.message };

    if (validation.data.farming_practices.length > 0) {
      const { error: insertPracticesError } = await supabase.from("listing_farming_practices").insert(
        validation.data.farming_practices.map((practice_code) => ({ listing_id: listingId, practice_code }))
      );
      if (insertPracticesError) return { error: insertPracticesError.message };
    }

    revalidatePath("/listings");
    revalidatePath("/grapes");
    revalidatePath("/bulk-wine");
    revalidatePath("/listings/mine");
    revalidatePath(`/listings/${listingId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to update listings.",
    };
  }
}
