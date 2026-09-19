"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateBulkWineListingSchema, type CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";
import { generateBulkWineTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { flags } from "@/lib/flags";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";
import { normalizeWinemakerName } from "@/lib/validation/winemaker";

export async function createNewBulkWineListing(data: CreateBulkWineListingInput) {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, company_name, full_name")
      .eq("id", user.id)
      .single();
    if (flags.usernames && !profile?.username) {
      return { error: "Please choose a username before publishing a listing.", needsUsername: true };
    }

    const vineyardName = validation.data.single_vineyard ? validation.data.vineyard_name?.trim() || null : null;
    const winemakerName = normalizeWinemakerName(validation.data.winemaker_name);

    if (validation.data.is_nda) {
      const [{ data: otherListings }, { data: otherWinemakers }] = await Promise.all([
        supabase.from("listings").select("vineyard_name").eq("user_id", user.id),
        // Owner-only table, so this is just the seller's own past winemakers.
        supabase.from("listing_winemakers").select("winemaker_name").limit(200),
      ]);
      const guard = checkFreeTextForNdaLeak({
        text: validation.data.description,
        companyName: profile?.company_name,
        fullName: profile?.full_name,
        username: profile?.username,
        // A winemaker is as identifying as a vineyard name, so the
        // description can't name one either (the guard only cares that it's
        // a name to look for).
        vineyardNames: [
          vineyardName,
          winemakerName,
          ...(otherListings ?? []).map((l) => l.vineyard_name),
          ...(otherWinemakers ?? []).map((w) => w.winemaker_name),
        ],
      });
      if (guard.blocked) return { error: guard.reason };
    }

    const vintageYear = validation.data.is_multi_vintage ? null : validation.data.vintage_year ?? null;

    // WINE-1/VIN-8: listings + bulk_wine_details + listing_farming_practices
    // span three tables with no client-side transaction support in this
    // app's Supabase setup (Phase 0 audit -- no ORM, no RPC layer). Insert
    // the parent row first, then the children; if either child insert
    // fails, delete the just-created listing rather than leaving an
    // orphaned bulk_wine row with no details (docs/scope-addendum-decisions.md).
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        listing_type: "bulk_wine",
        variety: validation.data.variety,
        region_ava: validation.data.region_ava,
        sub_ava: validation.data.sub_ava || null,
        description: validation.data.description,
        status: "available",
        is_nda: validation.data.is_nda,
        nda_location_precision: validation.data.nda_location_precision,
        single_vineyard: validation.data.single_vineyard,
        vineyard_name: vineyardName,
        // Grapes-only columns keep their DB defaults/NOT NULL constraints
        // satisfied with placeholder zeros -- bulk wine never reads them
        // (WINE-7: structurally separate columns, not a shared unit-tagged one).
        estimated_tons: 0,
        minimum_tons: 0,
        price_per_ton: 0,
        farming_practice: "conventional",
        harvest_year: vintageYear ?? new Date().getFullYear(),
        title: generateBulkWineTitle(
          validation.data.variety,
          vintageYear ?? undefined,
          validation.data.is_multi_vintage,
          validation.data.sub_ava || validation.data.region_ava
        ),
      })
      .select("id")
      .single();

    if (listingError || !listing) return { error: listingError?.message ?? "Couldn't create the listing." };

    const { error: detailsError } = await supabase.from("bulk_wine_details").insert({
      listing_id: listing.id,
      quantity_gallons: validation.data.quantity_gallons,
      price_per_gallon: validation.data.price_per_gallon,
      abv: validation.data.abv,
      total_so2_ppm: validation.data.total_so2_ppm ?? null,
      vintage_year: vintageYear,
      is_multi_vintage: validation.data.is_multi_vintage,
      wine_location_state: validation.data.wine_location_state ?? null,
      wine_location_county: validation.data.wine_location_county ?? null,
    });

    if (detailsError) {
      await supabase.from("listings").delete().eq("id", listing.id);
      return { error: detailsError.message };
    }

    // Own owner/admin-only table (migration 0007), only touched when a
    // winemaker was actually entered.
    if (winemakerName) {
      const { error: winemakerError } = await supabase
        .from("listing_winemakers")
        .insert({ listing_id: listing.id, winemaker_name: winemakerName });
      if (winemakerError) {
        await supabase.from("listings").delete().eq("id", listing.id);
        return { error: winemakerError.message };
      }
    }

    if (validation.data.farming_practices.length > 0) {
      const { error: practicesError } = await supabase.from("listing_farming_practices").insert(
        validation.data.farming_practices.map((practice_code) => ({ listing_id: listing.id, practice_code }))
      );
      if (practicesError) {
        await supabase.from("listings").delete().eq("id", listing.id);
        return { error: practicesError.message };
      }
    }

    revalidatePath("/listings");
    revalidatePath("/grapes");
    revalidatePath("/bulk-wine");
    revalidatePath("/dashboard");
    return { success: true, id: listing.id as string };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to publish listings.",
    };
  }
}
