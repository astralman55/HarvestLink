import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WantedRow } from "@/lib/wanted/data";

export interface ResponseRow {
  id: string;
  request_id: string;
  responder_id: string;
  listing_id: string | null;
  responder_anonymous: boolean;
  created_at: string;
}

export interface ThreadAccess {
  response: ResponseRow;
  request: WantedRow;
  /** Which side the asking member is on. */
  role: "poster" | "responder";
}

/**
 * The one authorization check for a response thread: only the request's poster and
 * the responder may see or write to it. Anyone else, and any bad id, gets null, so
 * a caller cannot tell "does not exist" from "not yours".
 */
export async function getThreadAccess(responseId: string, userId: string): Promise<ThreadAccess | null> {
  const admin = createAdminClient();
  const { data: response } = await admin
    .from("wanted_responses")
    .select("id, request_id, responder_id, listing_id, responder_anonymous, created_at")
    .eq("id", responseId)
    .maybeSingle();
  if (!response) return null;
  const { data: request } = await admin
    .from("wanted_requests")
    .select("id, user_id, request_type, variety, regions, quantity_min, quantity_max, max_price, show_price, year, farming_practice, notes, is_anonymous, status, expires_at, created_at")
    .eq("id", response.request_id)
    .maybeSingle();
  if (!request) return null;
  const role = request.user_id === userId ? "poster" : response.responder_id === userId ? "responder" : null;
  if (!role) return null;
  return { response: response as ResponseRow, request: request as WantedRow, role };
}
