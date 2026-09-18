"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validation/listing";
import { generateListingTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";

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

    // Scoping the update to `user_id` here is defense in depth on top of
    // the "Growers can update their own listings" RLS policy — without it,
    // a mismatched owner would just silently update zero rows.
    const { data: updated, error } = await supabase
      .from("listings")
      .update({
        ...validation.data,
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
