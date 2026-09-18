"use client";

import { useRouter } from "next/navigation";
import { BulkWineForm } from "@/components/listings/BulkWineForm";
import { createNewBulkWineListing } from "@/app/(dashboard)/listings/create/bulk-wine-actions";
import type { CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";

export function BulkWineSellForm() {
  const router = useRouter();

  async function handleSubmit(data: CreateBulkWineListingInput) {
    const result = await createNewBulkWineListing(data);
    if (result?.error) {
      if (result.needsUsername) {
        router.push(`/choose-username?redirect_to=${encodeURIComponent("/sell/bulk-wine")}`);
        return;
      }
      return { error: result.error };
    }
    router.push("/listings/mine");
  }

  return <BulkWineForm onSubmit={handleSubmit} submitLabel="Publish Listing" submittingLabel="Publishing…" />;
}
