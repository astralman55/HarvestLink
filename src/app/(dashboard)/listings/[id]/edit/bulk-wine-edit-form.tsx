"use client";

import { useRouter } from "next/navigation";
import { BulkWineForm } from "@/components/listings/BulkWineForm";
import { updateBulkWineListing } from "./bulk-wine-actions";
import type { CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";
import type { Listing } from "@/types";
import type { US_STATES } from "@/lib/constants/bulk-wine";

export function BulkWineEditForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const details = listing.bulk_wine_details;

  const defaultValues: Partial<CreateBulkWineListingInput> = {
    variety: listing.variety,
    region_ava: listing.region_ava,
    sub_ava: listing.sub_ava ?? undefined,
    description: listing.description ?? undefined,
    status: listing.status,
    is_nda: listing.is_nda,
    nda_location_precision: listing.nda_location_precision,
    single_vineyard: listing.single_vineyard,
    vineyard_name: listing.vineyard_name ?? undefined,
    quantity_gallons: details?.quantity_gallons,
    price_per_gallon: details?.price_per_gallon,
    abv: details?.abv,
    total_so2_ppm: details?.total_so2_ppm ?? undefined,
    vintage_year: details?.vintage_year ?? undefined,
    is_multi_vintage: details?.is_multi_vintage ?? false,
    wine_location_state: (details?.wine_location_state ?? undefined) as (typeof US_STATES)[number] | undefined,
    wine_location_county: details?.wine_location_county ?? undefined,
    winemaker_name: details?.winemaker_name ?? undefined,
    farming_practices: (listing.listing_farming_practices ?? []).map((p) => p.practice_code),
  };

  async function handleSubmit(data: CreateBulkWineListingInput) {
    const result = await updateBulkWineListing(listing.id, data);
    if (result?.error) return { error: result.error };
    router.push("/listings/mine");
  }

  return (
    <BulkWineForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submittingLabel="Saving…"
      showStatusField
      originalIsNda={listing.is_nda}
    />
  );
}
