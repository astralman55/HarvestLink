"use client";

import { useRouter } from "next/navigation";
import { ListingForm } from "@/components/listings/ListingForm";
import { createNewListing } from "./actions";
import type { CreateListingInput } from "@/lib/validation/listing";

export default function CreateListingPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateListingInput) {
    const result = await createNewListing(data);
    if (result?.error) return { error: result.error };
    router.push("/listings/mine");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-900">Create a Listing</h1>
      <p className="mt-1 text-sm text-stone-500">
        Publish tonnage, pricing, and full vineyard detail — buyers filter on every field below.
      </p>

      <ListingForm onSubmit={handleSubmit} submitLabel="Publish Listing" submittingLabel="Publishing…" />
    </div>
  );
}
