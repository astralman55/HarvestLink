import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChooseUsernameForm } from "./ChooseUsernameForm";
import { flags } from "@/lib/flags";

interface ChooseUsernamePageProps {
  searchParams: Promise<{ redirect_to?: string }>;
}

// USR-7: existing accounts (pre-dating usernames) hit this blocking step on
// their next login. Server-checked so it can't be skipped by navigating
// straight to the destination URL.
export default async function ChooseUsernamePage({ searchParams }: ChooseUsernamePageProps) {
  const { redirect_to } = await searchParams;
  const destination = redirect_to || "/dashboard";

  if (!flags.usernames) redirect(destination);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect_to=${encodeURIComponent(destination)}`);

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (profile?.username) redirect(destination);

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Choose your username</h1>
      <p className="mt-1 text-sm text-stone-500">
        This is your public handle. It may be visible to other members in the future. If you plan to sell
        confidentially, don&apos;t use your winery or vineyard name.
      </p>
      <ChooseUsernameForm destination={destination} />
    </div>
  );
}
