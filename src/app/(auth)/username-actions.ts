"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { UsernameSchema, type UsernameCheckResult } from "@/lib/validation/username";

/**
 * USR-1/USR-3: live, debounced availability check shared by the signup
 * form and the "choose your username" migration step. Rate-limited per
 * USR-1. Returns only available/unavailable + a human reason -- never any
 * account details (USR-9).
 */
export async function checkUsernameAvailability(rawUsername: string): Promise<UsernameCheckResult> {
  const { allowed } = await checkRateLimit("username-availability", { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return { available: false, reason: "Too many checks -- wait a moment and try again." };
  }

  const parsed = UsernameSchema.safeParse(rawUsername);
  if (!parsed.success) {
    return { available: false, reason: parsed.error.issues[0]?.message ?? "Invalid username." };
  }
  const normalized = parsed.data.toLowerCase();

  try {
    const supabase = await createClient();

    const { data: reserved, error: reservedError } = await supabase
      .from("reserved_usernames")
      .select("term")
      .eq("term", normalized)
      .maybeSingle();
    // A query error (e.g. migration 0003 not applied yet) must NOT read as
    // "no match found" -- that would silently report an unchecked username
    // as available. Ground Rule: server is the source of truth.
    if (reservedError) throw reservedError;
    if (reserved) {
      return { available: false, reason: "That username is reserved. Try another." };
    }

    const { data: taken, error: takenError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username_normalized", normalized)
      .maybeSingle();
    if (takenError) throw takenError;
    if (taken) {
      return { available: false, reason: "Sorry, that username is taken. Try another." };
    }

    return { available: true };
  } catch {
    return { available: false, reason: "Couldn't check availability right now. Try again in a moment." };
  }
}
