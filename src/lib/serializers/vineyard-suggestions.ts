/**
 * VIN-5: typeahead suggestions may only ever come from (a) the current
 * user's own past entries or (b) non-NDA public listings -- never another
 * user's NDA listing. `listings` RLS is still row-level "viewable by
 * anyone" (unchanged since Phase 1), so this filtering has to happen here
 * in application code rather than being enforced by the database query
 * itself. Pure and unit-tested (src/lib/serializers/vineyard-suggestions.test.ts)
 * so the privacy rule is verified the same way the NDA canary test verifies
 * serializeListing.
 */
export interface VineyardListingRow {
  vineyard_name: string | null;
  user_id: string;
  is_nda: boolean;
}

export function filterVineyardSuggestions(rows: VineyardListingRow[], viewerUserId: string | null, limit = 8): string[] {
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const row of rows) {
    if (!row.vineyard_name) continue;
    const isOwn = viewerUserId != null && row.user_id === viewerUserId;
    if (!isOwn && row.is_nda) continue; // never another user's NDA vineyard name
    if (seen.has(row.vineyard_name)) continue;
    seen.add(row.vineyard_name);
    suggestions.push(row.vineyard_name);
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}
