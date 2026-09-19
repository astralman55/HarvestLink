"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeSearchParams } from "@/lib/alerts/query";

const MAX_SEARCHES = 10;

const CreateSchema = z.object({
  listingType: z.enum(["grapes", "bulk_wine"]),
  query: z.string().max(1500),
  name: z.string().trim().min(1, "Give this alert a name.").max(80, "Keep the name under 80 characters."),
});

/**
 * Saves the filters a member is looking at. The stored query is rebuilt from
 * an allowlist of known filter keys, never taken as-is from the client, and
 * the row is written with the member's own session so row-level security is
 * the second lock (a member can only ever create rows for themselves).
 */
export async function createSavedSearch(input: { listingType: "grapes" | "bulk_wine"; query: string; name: string }) {
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid alert." };

  const { allowed } = await checkRateLimit("save-search", { limit: 20, windowMs: 60_000 });
  if (!allowed) return { error: "Too many requests. Please wait a moment and try again." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Log in to save a search.", needsLogin: true as const };

    const { count } = await supabase.from("saved_searches").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_SEARCHES) {
      return { error: `You can save up to ${MAX_SEARCHES} searches. Delete one on your alerts page to add another.` };
    }

    const query = sanitizeSearchParams(new URLSearchParams(parsed.data.query));
    const { data, error } = await supabase
      .from("saved_searches")
      .insert({ user_id: user.id, name: parsed.data.name, listing_type: parsed.data.listingType, query })
      .select("id")
      .single();
    if (error) {
      // Migration 0009 not applied yet, or the database-level limit tripped.
      return { error: /20 searches/.test(error.message) ? "You have reached the limit of saved searches." : "We couldn't save that search. Please try again." };
    }

    revalidatePath("/alerts");
    return { success: true as const, id: data.id as string };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}

export async function setSavedSearchActive(id: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("saved_searches").update({ is_active: isActive }).eq("id", id);
    if (error) return { error: "We couldn't update that alert." };
    revalidatePath("/alerts");
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again." };
  }
}

export async function renameSavedSearch(id: string, name: string) {
  const parsed = CreateSchema.shape.name.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("saved_searches").update({ name: parsed.data }).eq("id", id);
    if (error) return { error: "We couldn't rename that alert." };
    revalidatePath("/alerts");
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again." };
  }
}

export async function deleteSavedSearch(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) return { error: "We couldn't delete that alert." };
    revalidatePath("/alerts");
    return { success: true as const };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again." };
  }
}
