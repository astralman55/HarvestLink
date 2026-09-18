import { redirect } from "next/navigation";
import { needsUsername } from "@/lib/supabase/needs-username";
import { flags } from "@/lib/flags";
import { BulkWineSellForm } from "./BulkWineSellForm";

export default async function SellBulkWinePage() {
  // Dark-launch discipline: even a direct/bookmarked visit stays off while
  // the flag is off, same as the rest of Requirement 4.
  if (!flags.bulkWine) redirect("/sell/grapes");
  if (await needsUsername()) {
    redirect(`/choose-username?redirect_to=${encodeURIComponent("/sell/bulk-wine")}`);
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">Sell Bulk Wine</p>
      <h1 className="mt-1 text-2xl font-semibold text-stone-900">Create a Bulk Wine Listing</h1>
      <p className="mt-1 text-sm text-stone-500">Priced per gallon. Publish full detail — buyers filter on every field below.</p>

      <BulkWineSellForm />
    </div>
  );
}
