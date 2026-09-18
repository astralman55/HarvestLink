import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS and can call functions locked
 * to the `service_role` Postgres role (e.g. get_email_for_login, see
 * migration 0004). Server-only -- SUPABASE_SERVICE_ROLE_KEY must never
 * reach the browser. Never expose this client or its results directly to a
 * client component; only use it inside Server Actions/Route Handlers and
 * return the minimum derived result.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role not configured.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
