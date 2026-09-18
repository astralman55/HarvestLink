"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateBulkWineListingSchema, type CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";
import { generateBulkWineTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";

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

    const vineyardName = validation.data.single_vineyard ? validation.data.vineyard_name?.trim() || null : null;
    const vintageYear = validation.data.is_multi_vintage ? null : validation.data.vintage_year ?? null;

    if (validation.data.is_nda) {
      const [{ data: profile }, { data: otherListings }] = await Promise.all([
        supabase.from("profiles").select("username, company_name, full_name").eq("id", user.id).single(),
        supabase.from("listings").select("vineyard_name").eq("user_id", user.id),
      ]);
      const guard = checkFreeTextForNdaLeak({
        text: validation.data.description,
        companyName: profile?.company_name,
        fullName: profile?.full_name,
        username: profile?.username,
        vineyardNames: [vineyardName, ...(otherListings ?? []).map((l) => l.vineyard_name)],
      });
      if (guard.blocked) return { error: guard.reason };
    }

    // Defense in depth on top of the "Growers can update their own
    // listings" RLS policy, same pattern as the grapes edit action.
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
      .eq("user_id", user.id)
      .eq("listing_type", "bulk_wine")
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
        wine_location_state: validation.data.wine_location_state,
        wine_location_county: validation.data.wine_location_county,
      })
      .eq("listing_id", listingId);
    if (detailsError) return { error: detailsError.message };

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
