"use server";

import { createClient } from "@/lib/supabase/server";
import { ChooseUsernameSchema, type ChooseUsernameInput } from "@/lib/validation/auth";
import { checkUsernameAvailability } from "../username-actions";

export async function setUsername(formData: ChooseUsernameInput) {
  const validation = ChooseUsernameSchema.safeParse(formData);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Invalid username." };
  }

  const availability = await checkUsernameAvailability(formData.username);
  if (!availability.available) {
    return { error: availability.reason };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Your session has expired. Please log in again." };

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ username: formData.username })
      .eq("id", user.id)
      .is("username", null) // never silently overwrite an existing username
      .select("id");

    if (error) {
      return { error: "That username was just taken by someone else. Please choose another and try again." };
    }
    if (!updated || updated.length === 0) {
      return { error: "You already have a username set." };
    }
    return { success: true };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}
