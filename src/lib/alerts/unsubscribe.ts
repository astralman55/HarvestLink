import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUnsubscribeToken(token: unknown): token is string {
  return typeof token === "string" && UUID.test(token);
}

/**
 * Pauses saved searches from an email link, without a login. The token is an
 * unguessable UUID that only ever appears in that member's own emails.
 * `scope: "one"` stops just the search the link was for; `scope: "all"` (the
 * one-click List-Unsubscribe header) stops every alert for that member.
 * Returns whether the token matched anything.
 */
export async function unsubscribeByToken(token: string, scope: "one" | "all"): Promise<boolean> {
  if (!isValidUnsubscribeToken(token)) return false;
  const admin = createAdminClient();
  const { data: found } = await admin.from("saved_searches").select("id, user_id").eq("unsubscribe_token", token).maybeSingle();
  if (!found) return false;

  const query = admin.from("saved_searches").update({ is_active: false });
  const { error } = scope === "all" ? await query.eq("user_id", found.user_id) : await query.eq("id", found.id);
  return !error;
}
