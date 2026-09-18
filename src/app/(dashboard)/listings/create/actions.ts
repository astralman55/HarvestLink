"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validation/listing";
import { generateListingTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createNewListing(data: CreateListingInput) {
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

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      ...validation.data,
      title: generateListingTitle(
        validation.data.variety,
        validation.data.clone,
        validation.data.sub_ava || validation.data.region_ava
      ),
      status: "available",
    });

    if (error) return { error: error.message };

    revalidatePath("/listings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to publish listings.",
    };
  }
}
