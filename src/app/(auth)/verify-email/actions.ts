"use server";

import { createClient } from "@/lib/supabase/server";
import { VerifyCodeSchema } from "@/lib/auth/verification";
import { checkRateLimit } from "@/lib/rate-limit";
import { flags } from "@/lib/flags";
import { recordLoginEvent } from "@/lib/security/login-events";

// One message for every failure mode (wrong, expired, already used) so the
// response can't be used to probe which addresses have accounts.
const BAD_CODE = "That code is incorrect or has expired. Check the latest email, or request a new code.";

/**
 * Confirms a new account with the code from the signup email. On success
 * Supabase issues a session and the server client stores it in cookies, so
 * the user lands signed in -- there is no separate "now log in" step.
 */
export async function verifySignupCode(email: string, code: string) {
  const parsed = VerifyCodeSchema.safeParse({ email, code });
  if (!parsed.success) return { error: "Enter the code from your email." };

  // Best-effort per-IP throttle on top of Supabase's own verification limits.
  const { allowed } = await checkRateLimit("verify-code", { limit: 10, windowMs: 60_000 });
  if (!allowed) return { error: "Too many attempts. Please wait a minute and try again." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.code,
      type: "signup",
    });
    if (error || !data.user) return { error: BAD_CODE };
    await recordLoginEvent(data.user.id, "signup_code");

    // Same USR-7 check the login action does, for accounts created before
    // usernames were collected at signup.
    let needsUsername = false;
    if (flags.usernames) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
      needsUsername = !profile?.username;
    }
    return { success: true as const, needsUsername };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}

/**
 * Sends a fresh code. Deliberately reports success for any address that
 * passes format validation -- Supabase itself does the same, so this never
 * confirms or denies that an account exists.
 */
export async function resendSignupCode(email: string) {
  const parsed = VerifyCodeSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const { allowed, retryAfterSeconds } = await checkRateLimit("resend-code", { limit: 5, windowMs: 10 * 60_000 });
  if (!allowed) {
    return { error: `Too many requests. Try again in ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minute(s).` };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data });
    if (error) {
      // Supabase's own 60-second-per-address limit is the one real error worth showing.
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return { error: "Please wait a minute before requesting another code." };
      }
      return { error: "We couldn't send a new code. Please try again shortly." };
    }
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}
