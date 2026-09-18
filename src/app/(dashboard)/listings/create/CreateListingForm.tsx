"use client";

import { useRouter } from "next/navigation";
import { ListingForm } from "@/components/listings/ListingForm";
import { createNewListing } from "./actions";
import type { CreateListingInput } from "@/lib/validation/listing";

export function CreateListingForm() {
  const router = useRouter();

  async function handleSubmit(data: CreateListingInput) {
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

  return <ListingForm onSubmit={handleSubmit} submitLabel="Publish Listing" submittingLabel="Publishing…" />;
}
