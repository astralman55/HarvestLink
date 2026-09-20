import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { wantedTitle, type WantedType } from "@/lib/wanted/schema";

/** A wanted_requests row as stored. Never sent to a browser: serializeWanted() is the only way out. */
export interface WantedRow {
  id: string;
  user_id: string;
  request_type: WantedType;
  variety: string;
  regions: string[];
  quantity_min: number;
  quantity_max: number | null;
  max_price: number | null;
  show_price: boolean;
  year: number | null;
  farming_practice: string | null;
  notes: string;
  is_anonymous: boolean;
  status: "open" | "filled" | "closed";
  expires_at: string;
  created_at: string;
}

export interface PublicWanted {
  id: string;
  title: string;
  request_type: WantedType;
  variety: string;
  regions: string[];
  quantity_min: number;
  quantity_max: number | null;
  /** Null unless the poster chose to show it. */
  max_price: number | null;
  year: number | null;
  farming_practice: string | null;
  notes: string;
  /** "Anonymous buyer", or the company name when the poster chose to show it. */
  poster: string;
  is_anonymous: boolean;
  status: WantedRow["status"];
  created_at: string;
  expires_at: string;
}

export const ANONYMOUS_POSTER = "Anonymous buyer";

const COLUMNS =
  "id, user_id, request_type, variety, regions, quantity_min, quantity_max, max_price, show_price, year, farming_practice, notes, is_anonymous, status, expires_at, created_at";

/**
 * The single place a stored request becomes something a visitor may see. It
 * copies fields one by one (an allowlist), so a column added later is private
 * until someone deliberately adds it here. An anonymous poster's user id and
 * name never pass through.
 */
export function serializeWanted(row: WantedRow, posterName: string | null): PublicWanted {
  const num = (value: number | string | null) => (value == null ? null : Number(value));
  const quantityMin = Number(row.quantity_min);
  const quantityMax = num(row.quantity_max);
  return {
    id: row.id,
    title: wantedTitle({ request_type: row.request_type, variety: row.variety, regions: row.regions, quantity_min: quantityMin, quantity_max: quantityMax, year: row.year }),
    request_type: row.request_type,
    variety: row.variety,
    regions: [...row.regions],
    quantity_min: quantityMin,
    quantity_max: quantityMax,
    max_price: row.show_price ? num(row.max_price) : null,
    year: row.year,
    farming_practice: row.farming_practice,
    notes: row.notes,
    poster: row.is_anonymous ? ANONYMOUS_POSTER : posterName || "A member",
    is_anonymous: row.is_anonymous,
    status: row.status,
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
}

async function posterNames(rows: WantedRow[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.filter((row) => !row.is_anonymous).map((row) => row.user_id))];
  if (ids.length === 0) return new Map();
  const { data } = await createAdminClient().from("profiles").select("id, company_name, full_name").in("id", ids);
  return new Map((data ?? []).map((p: { id: string; company_name: string | null; full_name: string | null }) => [p.id, p.company_name || p.full_name || "A member"]));
}

async function toPublic(rows: WantedRow[]): Promise<PublicWanted[]> {
  const names = await posterNames(rows);
  return rows.map((row) => serializeWanted(row, names.get(row.user_id) ?? null));
}

export interface WantedFilters {
  type?: WantedType;
  variety?: string;
  region?: string;
}

/**
 * Open, unexpired requests, newest first. Returns [] when the table does not
 * exist yet (migration 0011 not run), so a page never crashes over it.
 */
export async function getOpenWanted(filters: WantedFilters = {}, limit = 60): Promise<PublicWanted[]> {
  try {
    let query = createAdminClient()
      .from("wanted_requests")
      .select(COLUMNS)
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(filters.region ? 500 : limit);
    if (filters.type) query = query.eq("request_type", filters.type);
    if (filters.variety) query = query.eq("variety", filters.variety);
    const { data, error } = await query;
    if (error) throw error;
    let rows = (data ?? []) as WantedRow[];
    // A request that lists no regions accepts any region, so it matches every region filter.
    // Filtered here, not in SQL: the set of open requests is small and this avoids array-filter syntax quirks.
    const { region } = filters;
    if (region) rows = rows.filter((row) => row.regions.length === 0 || row.regions.includes(region));
    return await toPublic(rows.slice(0, limit));
  } catch {
    return [];
  }
}

/** One request by id, in any status, for its detail page. Null when missing. */
export async function getWantedById(id: string): Promise<{ row: WantedRow; view: PublicWanted } | null> {
  try {
    const { data } = await createAdminClient().from("wanted_requests").select(COLUMNS).eq("id", id).maybeSingle();
    if (!data) return null;
    const row = data as WantedRow;
    const [view] = await toPublic([row]);
    return { row, view };
  } catch {
    return null;
  }
}

export async function getOwnWanted(userId: string): Promise<PublicWanted[]> {
  try {
    const { data } = await createAdminClient()
      .from("wanted_requests")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as WantedRow[];
    // The owner sees their own request as they posted it, including the price they set.
    return rows.map((row) => serializeWanted({ ...row, show_price: true }, null));
  } catch {
    return [];
  }
}

/** Ids of requests still open right now, for the sitemap. */
export async function getOpenWantedForSitemap(): Promise<{ id: string; title: string; updated: string }[]> {
  const rows = await getOpenWanted({}, 500);
  return rows.map((row) => ({ id: row.id, title: row.title, updated: row.created_at }));
}
