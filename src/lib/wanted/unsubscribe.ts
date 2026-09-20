import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/seo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function signature(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(`wanted-optout:${userId}`).digest("hex").slice(0, 32);
}

/** The opt-out link for one member's "buyers are looking for your kind of lot" emails. Null when no secret is configured. */
export function wantedOptOutUrl(userId: string): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  return `${SITE_URL}/wanted/unsubscribe?u=${userId}&t=${signature(userId, secret)}`;
}

export function isValidWantedOptOut(userId: unknown, token: unknown): userId is string {
  const secret = process.env.CRON_SECRET;
  if (!secret || typeof userId !== "string" || typeof token !== "string" || !UUID.test(userId)) return false;
  const expected = Buffer.from(signature(userId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Records the opt-out. The signed link proves the member received the email; no login needed. */
export async function optOutOfWantedAlerts(userId: string, token: string): Promise<boolean> {
  if (!isValidWantedOptOut(userId, token)) return false;
  const { error } = await createAdminClient().from("wanted_alert_optouts").upsert({ user_id: userId }, { onConflict: "user_id" });
  return !error;
}
