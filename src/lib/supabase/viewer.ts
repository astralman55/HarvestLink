import { createClient } from "@/lib/supabase/server";
import { ANONYMOUS_VIEWER, type ViewerContext } from "@/lib/serializers/listing";

/** Resolves the current request's viewer context for the NDA-aware serializer (NDA-4). */
export async function resolveViewerContext(): Promise<ViewerContext> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ANONYMOUS_VIEWER;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return { userId: user.id, isAdmin: profile?.role === "admin" };
  } catch {
    return ANONYMOUS_VIEWER;
  }
}
