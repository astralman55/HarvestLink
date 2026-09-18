import type { ListingSearchFilters } from "@/types";

/** Flattens a Next.js searchParams object into ListingSearchFilters (string values only). */
export function parseListingSearchParams(params: Record<string, string | string[] | undefined>): ListingSearchFilters {
  const filters: ListingSearchFilters = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) {
      (filters as Record<string, string>)[key] = value;
    }
  }
  return filters;
}
