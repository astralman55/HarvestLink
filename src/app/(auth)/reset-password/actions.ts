"use server";

import { createClient } from "@/lib/supabase/server";
import { PasswordSchema } from "@/lib/validation/auth";
import { VerifyCodeSchema } from "@/lib/auth/verification";
import { isPasswordBreached } from "@/lib/password-breach";
import { checkRateLimit } from "@/lib/rate-limit";

// One message for wrong, expired and already-used codes.
const BAD_CODE = "That code is incorrect or has expired. Check the latest email, or request a new code.";

/**
 * Step 1 of a reset by code: verifying it signs the user in on a short-lived
 * recovery session, which is what authorizes setNewPassword() below.
 */
export async function verifyResetCode(email: string, code: string) {
  const parsed = VerifyCodeSchema.safeParse({ email, code });
  if (!parsed.success) return { error: "Enter the code from your email." };

  const { allowed } = await checkRateLimit("verify-code", { limit: 10, windowMs: 60_000 });
  if (!allowed) return { error: "Too many attempts. Please wait a minute and try again." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.code,
      type: "recovery",
    });
    if (error || !data.user) return { error: BAD_CODE };
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}

/**
 * Step 2 (reached either by code or by the email's link): sets the new
 * password for whoever holds the current recovery session, applying the same
 * rules as signup (length, known-breach check), then signs out every OTHER
 * session so a stolen old session doesn't survive the reset.
 */
export async function setNewPassword(password: string) {
  const validation = PasswordSchema.safeParse(password);
  if (!validation.success) return { error: validation.error.issues[0]?.message ?? "Choose a stronger password." };

  const { allowed } = await checkRateLimit("set-password", { limit: 10, windowMs: 60_000 });
  if (!allowed) return { error: "Too many attempts. Please wait a minute and try again." };

  if (await isPasswordBreached(password)) {
    return { error: "That password has appeared in a known data breach. Please choose a different one." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Your reset session has expired. Request a new code to continue.", expired: true as const };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (error.code === "same_password") return { error: "Choose a password you haven't used before." };
      if (error.code === "weak_password") return { error: "That password is too weak. Please choose a longer one." };
      return { error: "We couldn't update your password. Please try again." };
    }

    await supabase.auth.signOut({ scope: "others" });
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}
