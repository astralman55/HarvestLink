import { createClient } from "@/lib/supabase/server";
import { flags } from "@/lib/flags";

/** USR-7: existing accounts can browse without a username, but must choose one before creating a listing. */
export async function needsUsername(): Promise<boolean> {
  if (!flags.usernames) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    return !profile?.username;
  } catch {
    // Demo mode / unreachable Supabase: let the form's own Server Action
    // surface a clear "couldn't reach Supabase" error instead.
    return false;
  }
}
