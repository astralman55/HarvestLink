"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { filterVineyardSuggestions } from "@/lib/serializers/vineyard-suggestions";

/**
 * VIN-5: debounced, non-binding typeahead. Never blocks form submission if
 * it fails -- callers should treat any falsy/empty result as "no
 * suggestions available" rather than an error.
 */
export async function getVineyardNameSuggestions(query: string): Promise<string[]> {
  const { allowed } = await checkRateLimit("vineyard-suggestions", { limit: 30, windowMs: 60_000 });
  if (!allowed) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("listings")
      .select("vineyard_name, user_id, is_nda")
      .not("vineyard_name", "is", null)
      .ilike("vineyard_name", `%${trimmed}%`)
      .limit(30);
    if (error) return [];

    return filterVineyardSuggestions(data ?? [], user?.id ?? null);
  } catch {
    return [];
  }
}
