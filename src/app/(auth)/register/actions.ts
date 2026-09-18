"use server";

import { createClient } from "@/lib/supabase/server";
import { RegisterSchema, type RegisterInput } from "@/lib/validation/auth";
import { checkUsernameAvailability } from "../username-actions";
import { isPasswordBreached } from "@/lib/password-breach";
import { checkRateLimit } from "@/lib/rate-limit";
import { flags } from "@/lib/flags";

export async function handleSignUp(formData: RegisterInput) {
  const validation = RegisterSchema.safeParse(formData);
  if (!validation.success) {
    return { error: "Data manipulation vector rejected by validation schema." };
  }

  const { allowed } = await checkRateLimit("signup", { limit: 10, windowMs: 60_000 });
  if (!allowed) {
    return { error: "Too many signup attempts. Please wait a moment and try again." };
  }

  // Final authoritative check right before insert -- the live check on the
  // form is UX only (Ground Rule: server is the source of truth). This is
  // also what turns the vast majority of concurrent-signup races (USR-3)
  // into a friendly message instead of an opaque DB error, since it
  // narrows the residual race window to the gap between this call and the
  // signUp() insert below.
  if (flags.usernames) {
    const availability = await checkUsernameAvailability(formData.username ?? "");
    if (!availability.available) {
      return { error: availability.reason };
    }
  }

  if (await isPasswordBreached(formData.password)) {
    return {
      error: "That password has appeared in a known data breach. Please choose a different one.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          company_name: formData.companyName || null,
          full_name: formData.fullName || null,
          role: formData.role,
          region_ava: formData.regionAva || null,
          address: formData.address || null,
          username: flags.usernames ? formData.username : null,
        },
      },
    });

    if (error) {
      // The pre-check above passed, so if the profile insert trigger still
      // failed while usernames are enabled, a same-instant username race is
      // the most likely cause (USR-3) -- Supabase Auth's own error message
      // for a failed trigger is a generic wrapper, not the underlying
      // Postgres detail.
      if (flags.usernames) {
        return { error: "That username was just taken by someone else. Please choose another and try again." };
      }
      return { error: error.message };
    }
    return { success: true };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to enable sign up.",
    };
  }
}
