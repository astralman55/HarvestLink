import { redirect } from "next/navigation";
import { needsUsername } from "@/lib/supabase/needs-username";
import { GrapesSellForm } from "./GrapesSellForm";

export default async function SellGrapesPage() {
  if (await needsUsername()) {
    redirect(`/choose-username?redirect_to=${encodeURIComponent("/sell/grapes")}`);
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">Sell Grapes</p>
      <h1 className="mt-1 text-2xl font-semibold text-stone-900">Create a Grapes Listing</h1>
      <p className="mt-1 text-sm text-stone-500">Priced per ton. Publish full detail — buyers filter on every field below.</p>

      <GrapesSellForm />
    </div>
  );
}
