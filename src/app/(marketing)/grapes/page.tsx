import type { Metadata } from "next";
import { Grape } from "lucide-react";
import { MarketplaceGuide } from "@/components/marketplace/MarketplaceGuide";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getListings } from "@/lib/data/listings";
import { parseListingSearchParams } from "@/lib/search-params";
import { SaveSearchButton } from "@/components/marketplace/SaveSearchButton";
import { describeSearch, queryToFilters, sanitizeSearchParams } from "@/lib/alerts/query";
import { resolveViewerContext } from "@/lib/supabase/viewer";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  // Filtered or sorted views are thin, near-duplicate pages: keep them out of the
  // index but let crawlers follow the links, and point them at the clean URL.
  const filtered = Object.values(params).some((value) => (Array.isArray(value) ? value.length > 0 : !!value));
  const base = pageMetadata({
    title: "Wine Grapes for Sale by the Ton | HarvestLink",
    description:
      "Browse wine grape lots for sale direct from growers. Filter by variety, region, harvest year, farming practice, tonnage and price per ton.",
    path: "/grapes",
  });
  return filtered ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function GrapesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseListingSearchParams(params);
  filters.listing_type = "grapes";

  const [listings, viewer] = await Promise.all([getListings(filters), resolveViewerContext()]);
  const savedQuery = sanitizeSearchParams(params);
  const returnTo = savedQuery ? `/grapes?${savedQuery}` : "/grapes";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Wine Grapes for Sale", path: "/grapes" },
        ])}
      />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Wine Grapes for Sale</h1>
          <p className="mt-1 text-sm text-stone-500">
            {listings.length} lot{listings.length === 1 ? "" : "s"} matching your search
          </p>
        </div>
        <SaveSearchButton
          key={savedQuery}
          listingType="grapes"
          query={savedQuery}
          defaultName={describeSearch("grapes", queryToFilters(savedQuery))}
          isLoggedIn={viewer.userId != null}
          returnTo={returnTo}
        />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterPanel />

        <div className="flex-1">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 py-20 text-center">
              <Grape className="size-10 text-stone-300" />
              <p className="mt-4 font-medium text-stone-700">No lots match these filters</p>
              <p className="mt-1 text-sm text-stone-500">Try widening your region or variety selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>

      <MarketplaceGuide market="grapes" />
    </div>
  );
}
