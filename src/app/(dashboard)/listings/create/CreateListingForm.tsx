"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListingForm } from "@/components/listings/ListingForm";
import { BulkWineForm } from "@/components/listings/BulkWineForm";
import { ListingTypeChooser } from "@/components/listings/ListingTypeChooser";
import { createNewListing } from "./actions";
import { createNewBulkWineListing } from "./bulk-wine-actions";
import { flags } from "@/lib/flags";
import type { CreateListingInput } from "@/lib/validation/listing";
import type { CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";
import type { ListingType } from "@/types";

export function CreateListingForm() {
  const router = useRouter();
  // WINE-1: type is chosen once, at creation, and can't change afterward.
  // Behind the flag, skip the chooser entirely -- grapes is the only type
  // that has ever existed, so that stays the unchanged default.
  const [chosenType, setChosenType] = useState<ListingType | null>(flags.bulkWine ? null : "grapes");

  async function handleGrapesSubmit(data: CreateListingInput) {
    const result = await createNewListing(data);
    if (result?.error) {
      if (result.needsUsername) {
        router.push(`/choose-username?redirect_to=${encodeURIComponent("/listings/create")}`);
        return;
      }
      return { error: result.error };
    }
    router.push("/listings/mine");
  }

  async function handleBulkWineSubmit(data: CreateBulkWineListingInput) {
    const result = await createNewBulkWineListing(data);
    if (result?.error) {
      if (result.needsUsername) {
        router.push(`/choose-username?redirect_to=${encodeURIComponent("/listings/create")}`);
        return;
      }
      return { error: result.error };
    }
    router.push("/listings/mine");
  }

  if (chosenType === null) {
    return <ListingTypeChooser onChoose={setChosenType} />;
  }

  if (chosenType === "bulk_wine") {
    return <BulkWineForm onSubmit={handleBulkWineSubmit} submitLabel="Publish Listing" submittingLabel="Publishing…" />;
  }

  return <ListingForm onSubmit={handleGrapesSubmit} submitLabel="Publish Listing" submittingLabel="Publishing…" />;
}
