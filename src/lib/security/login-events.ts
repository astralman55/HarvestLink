import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { readRequestContext } from "@/lib/security/request-context";

export type LoginMethod = "password" | "signup_code" | "email_link" | "password_reset";

/**
 * Records that `userId` just signed in: when, approximately where (country,
 * region, city from Vercel's IP-derived headers), a shortened IP network, and a
 * device label like "Chrome on Windows". The full IP address and the raw
 * user-agent are never stored.
 *
 * Best-effort by design: this runs after the sign-in has already succeeded, so
 * a failure here (table not created yet, database hiccup, no service key in
 * local development) is swallowed and must never turn a good login into an
 * error. Written with the service role; members can read their own rows but
 * cannot write any (migration 0010).
 */
export async function recordLoginEvent(userId: string, method: LoginMethod): Promise<void> {
  try {
    const ctx = readRequestContext(await headers());
    await createAdminClient().from("login_events").insert({
      user_id: userId,
      method,
      country: ctx.country,
      region: ctx.region,
      city: ctx.city,
      ip_network: ctx.ipNetwork,
      device: ctx.device,
    });
  } catch {
    // See doc comment above.
  }
}
