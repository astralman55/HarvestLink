"use server";

import { createClient } from "@/lib/supabase/server";
import { VerifyCodeSchema } from "@/lib/auth/verification";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Emails a password-reset code (and a click-through link) to the address.
 * Reports success for any well-formed address, exactly like Supabase does, so
 * this can't be used to find out which emails have accounts.
 */
export async function requestPasswordReset(email: string) {
  const parsed = VerifyCodeSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const { allowed, retryAfterSeconds } = await checkRateLimit("forgot-password", { limit: 5, windowMs: 10 * 60_000 });
  if (!allowed) {
    return { error: `Too many requests. Try again in ${Math.max(1, Math.ceil(retryAfterSeconds / 60))} minute(s).` };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data);
    if (error) {
      // Supabase's own one-email-per-minute-per-address limit is the one
      // error that says nothing about whether the account exists.
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return { error: "Please wait a minute before requesting another code." };
      }
      return { error: "We couldn't send the email. Please try again shortly." };
    }
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}
