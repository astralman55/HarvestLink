"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validation/listing";
import { generateListingTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";

export async function updateListing(listingId: string, data: CreateListingInput) {
  const validation = CreateListingSchema.safeParse(data);
  if (!validation.success) {
    return { error: "Invalid payload inputs." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized access token context." };

    // VIN-2/VIN-8: never store a vineyard name when single_vineyard is off,
    // regardless of what the (hidden) form field still holds in memory.
    const vineyardName = validation.data.single_vineyard ? validation.data.vineyard_name?.trim() || null : null;

    // NDA-6: block identifying free text before it's ever published. Checks
    // this submission's own (possibly just-changed) vineyard name too, not
    // just other listings.
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

    // Scoping the update to `user_id` here is defense in depth on top of
    // the "Growers can update their own listings" RLS policy — without it,
    // a mismatched owner would just silently update zero rows. Toggling
    // is_nda writes to nda_audit_log automatically via a DB trigger
    // (migration 0003) -- no app code needed for that part.
    const { data: updated, error } = await supabase
      .from("listings")
      .update({
        ...validation.data,
        vineyard_name: vineyardName,
        title: generateListingTitle(
          validation.data.variety,
          validation.data.clone,
          validation.data.sub_ava || validation.data.region_ava
        ),
      })
      .eq("id", listingId)
      .eq("user_id", user.id)
      .select("id");

    if (error) return { error: error.message };
    if (!updated || updated.length === 0) {
      return { error: "Listing not found, or you don't have permission to edit it." };
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
