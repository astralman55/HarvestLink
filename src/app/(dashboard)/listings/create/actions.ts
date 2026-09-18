"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validation/listing";
import { generateListingTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { flags } from "@/lib/flags";

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

    // USR-7: existing accounts must choose a username before creating a
    // listing (they can still browse in the meantime).
    if (flags.usernames) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (!profile?.username) {
        return { error: "Please choose a username before publishing a listing.", needsUsername: true };
      }
    }

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
