import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateListingForm } from "./CreateListingForm";
import { flags } from "@/lib/flags";

async function needsUsername(): Promise<boolean> {
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

export default async function CreateListingPage() {
  // USR-7: existing accounts can browse without a username, but must
  // choose one before creating a listing. `redirect()` must run outside
  // the try/catch above -- it throws a control-flow signal Next.js expects
  // to propagate, not an error to swallow.
  if (await needsUsername()) {
    redirect(`/choose-username?redirect_to=${encodeURIComponent("/listings/create")}`);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-900">Create a Listing</h1>
      <p className="mt-1 text-sm text-stone-500">
        Publish full detail — buyers filter on every field below.
      </p>

      <CreateListingForm />
    </div>
  );
}
