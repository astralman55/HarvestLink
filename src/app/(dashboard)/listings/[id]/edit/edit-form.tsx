"use client";

import { useRouter } from "next/navigation";
import { ListingForm } from "@/components/listings/ListingForm";
import { updateListing } from "./actions";
import type { CreateListingInput } from "@/lib/validation/listing";
import type { Listing } from "@/types";

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();

  const defaultValues: Partial<CreateListingInput> = {
    variety: listing.variety,
    clone: listing.clone ?? undefined,
    rootstock: listing.rootstock ?? undefined,
    region_ava: listing.region_ava,
    sub_ava: listing.sub_ava ?? undefined,
    estimated_tons: listing.estimated_tons,
    minimum_tons: listing.minimum_tons,
    price_per_ton: listing.price_per_ton,
    brix_target: listing.brix_target ?? undefined,
    description: listing.description ?? undefined,
    farming_practice: listing.farming_practice,
    trellis_system: listing.trellis_system ?? undefined,
    soil_type: listing.soil_type ?? undefined,
    sun_exposure: listing.sun_exposure ?? undefined,
    slope_percent: listing.slope_percent ?? undefined,
    harvest_year: listing.harvest_year,
    status: listing.status,
    is_nda: listing.is_nda,
    nda_location_precision: listing.nda_location_precision,
    single_vineyard: listing.single_vineyard,
    vineyard_name: listing.vineyard_name ?? undefined,
  };

  async function handleSubmit(data: CreateListingInput) {
    const result = await updateListing(listing.id, data);
    if (result?.error) return { error: result.error };
    router.push("/listings/mine");
  }

  return (
    <ListingForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submittingLabel="Saving…"
      showStatusField
      originalIsNda={listing.is_nda}
    />
  );
}
