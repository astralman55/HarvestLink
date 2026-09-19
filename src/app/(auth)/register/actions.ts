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
    const { data, error } = await supabase.auth.signUp({
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
      // Bug caught in Phase 7 live testing (Decision 40): this used to
      // treat *any* signUp failure as a username race whenever the flag was
      // on, which mislabeled real errors (invalid email, Supabase's own
      // signup rate limit) as "username taken." A failed `handle_new_user`
      // trigger -- the actual username-race case (USR-3) -- is the one
      // failure mode that reaches this branch as a raw 500: profiles.email
      // uniqueness is enforced earlier by auth.users itself (a distinct,
      // already-readable error), and username_normalized is the only other
      // unique constraint the trigger can hit. Anything else (400s, 429s,
      // etc.) is a real Supabase error and gets its real message shown.
      if (flags.usernames && error.status === 500) {
        return { error: "That username was just taken by someone else. Please choose another and try again." };
      }
      return { error: error.message };
    }
    // With "Confirm email" on (production), signUp returns no session: the user
    // must enter the code Supabase just emailed before they can sign in. If
    // confirmation is switched off in the dashboard a session comes back
    // and they can go straight to the app.
    return { success: true, needsVerification: !data.session, email: formData.email };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to enable sign up.",
    };
  }
}
