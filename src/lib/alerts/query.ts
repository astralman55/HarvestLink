import { formatCurrency, formatCurrencyPrecise } from "@/lib/utils";
import type { ListingSearchFilters } from "@/types";

/**
 * A saved search stores the browse filters as a plain query string. Only the
 * keys below are ever kept: everything else in a URL (sort, page, tracking
 * parameters, anything a user types in by hand) is dropped, so what is stored
 * and later replayed by the daily job is always a known, bounded set.
 */
export const SAVED_SEARCH_KEYS = [
  "region_ava",
  "variety",
  "farming_practice",
  "trellis_system",
  "soil_type",
  "sun_exposure",
  "harvest_year",
  "slope_min",
  "slope_max",
  "min_tons",
  "max_tons",
  "min_price",
  "max_price",
  "min_brix",
  "max_brix",
  "hide_nda",
  "vineyard_name",
  "single_vineyard_only",
  "vintage_year",
  "wine_location_state",
  "wine_location_county",
  "abv_min",
  "abv_max",
  "min_gallons",
  "max_gallons",
  "max_so2",
  "farming_practices",
] as const satisfies readonly (keyof ListingSearchFilters)[];

const MAX_VALUE_LENGTH = 100;

/** Keeps only allowlisted, non-empty, length-limited values; stable key order so equal searches look equal. */
export function sanitizeSearchParams(params: Record<string, string | string[] | undefined> | URLSearchParams): string {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  const out = new URLSearchParams();
  for (const key of SAVED_SEARCH_KEYS) {
    const value = get(key)?.trim();
    if (value && value.length <= MAX_VALUE_LENGTH) out.set(key, value);
  }
  return out.toString();
}

/** Turns a stored query string back into the filter object the listing query understands. */
export function queryToFilters(query: string): ListingSearchFilters {
  const params = new URLSearchParams(sanitizeSearchParams(new URLSearchParams(query)));
  const filters: ListingSearchFilters = {};
  for (const key of SAVED_SEARCH_KEYS) {
    const value = params.get(key);
    if (value) (filters as Record<string, string>)[key] = value;
  }
  return filters;
}

const money = (value: string, precise: boolean) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return precise ? formatCurrencyPrecise(number) : formatCurrency(number);
};

/** A short human description of a search, used as the default name and in emails. */
export function describeSearch(listingType: "grapes" | "bulk_wine", filters: ListingSearchFilters): string {
  const bulk = listingType === "bulk_wine";
  const parts: string[] = [];

  if (filters.variety) parts.push(filters.variety);
  if (filters.region_ava) parts.push(filters.region_ava);
  if (filters.wine_location_county) parts.push(`stored in ${filters.wine_location_county}`);
  if (filters.wine_location_state) parts.push(`stored in ${filters.wine_location_state}`);
  if (filters.harvest_year) parts.push(`${filters.harvest_year} harvest`);
  if (filters.vintage_year) parts.push(`${filters.vintage_year} vintage`);
  if (filters.farming_practice) parts.push(filters.farming_practice);
  if (filters.farming_practices) parts.push(filters.farming_practices.split(",").filter(Boolean).join(" or ").replace(/_/g, " "));
  if (filters.min_price || filters.max_price) {
    const unit = bulk ? "/gal" : "/ton";
    if (filters.min_price && filters.max_price) parts.push(`${money(filters.min_price, bulk)} to ${money(filters.max_price, bulk)}${unit}`);
    else if (filters.max_price) parts.push(`under ${money(filters.max_price, bulk)}${unit}`);
    else parts.push(`over ${money(String(filters.min_price), bulk)}${unit}`);
  }
  if (filters.abv_min || filters.abv_max) parts.push(`ABV ${filters.abv_min ?? "any"} to ${filters.abv_max ?? "any"}`);
  if (filters.max_so2) parts.push(`up to ${filters.max_so2} ppm sulfites`);
  if (filters.min_tons) parts.push(`${filters.min_tons}+ tons`);
  if (filters.min_gallons) parts.push(`${filters.min_gallons}+ gal`);
  if (filters.hide_nda === "true") parts.push("public lots only");

  const base = bulk ? "bulk wine" : "grape lots";
  const text = parts.length > 0 ? `${parts.join(", ")} (${base})` : `All new ${base}`;
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

/** The public results page for a saved search (used in emails and on the alerts page). */
export function searchResultsPath(listingType: "grapes" | "bulk_wine", query: string): string {
  const base = listingType === "bulk_wine" ? "/bulk-wine" : "/grapes";
  return query ? `${base}?${query}` : base;
}
