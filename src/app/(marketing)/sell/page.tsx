import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { ListingTypeChooser } from "@/components/listings/ListingTypeChooser";
import { flags } from "@/lib/flags";

export const metadata: Metadata = pageMetadata({
  title: "Sell Wine Grapes & Bulk Wine | BWG",
  description:
    "List your wine grapes or bulk wine for buyers across the country. Sell openly or confidentially under NDA and receive inquiries through the site.",
  path: "/sell",
});

export default function SellPage() {
  // WINE-1/dark-launch: only one type has ever existed while the flag is
  // off, so skip straight to it instead of showing a one-option chooser.
  if (!flags.bulkWine) redirect("/sell/grapes");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-stone-900">What are you selling?</h1>
        <p className="mt-1 text-sm text-stone-500">You&apos;ll fill out the details on the next step.</p>
      </div>
      <ListingTypeChooser />
    </div>
  );
}
