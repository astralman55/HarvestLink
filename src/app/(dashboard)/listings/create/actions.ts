"use server";

import { createClient } from "@/lib/supabase/server";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validation/listing";
import { generateListingTitle } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { flags } from "@/lib/flags";
import { checkFreeTextForNdaLeak } from "@/lib/validation/nda-guard";

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, company_name, full_name")
      .eq("id", user.id)
      .single();
    if (flags.usernames && !profile?.username) {
      return { error: "Please choose a username before publishing a listing.", needsUsername: true };
    }

    // VIN-2/VIN-8: never store a vineyard name when single_vineyard is off,
    // regardless of what the (hidden) form field still holds in memory.
    const vineyardName = validation.data.single_vineyard ? validation.data.vineyard_name?.trim() || null : null;

    // NDA-6: block identifying free text before it's ever published. Checks
    // this submission's own vineyard name too, not just past listings --
    // "any vineyard name the seller has entered on any of their listings"
    // includes the one being created right now.
    if (validation.data.is_nda) {
      const { data: otherListings } = await supabase.from("listings").select("vineyard_name").eq("user_id", user.id);
      const guard = checkFreeTextForNdaLeak({
        text: validation.data.description,
        companyName: profile?.company_name,
        fullName: profile?.full_name,
        username: profile?.username,
        vineyardNames: [vineyardName, ...(otherListings ?? []).map((l) => l.vineyard_name)],
      });
      if (guard.blocked) return { error: guard.reason };
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      ...validation.data,
      vineyard_name: vineyardName,
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
