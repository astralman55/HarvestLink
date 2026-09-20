import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrowseTopics } from "@/components/landing/BrowseTopics";
import { PostRequestPrompt } from "@/components/wanted/PostRequestPrompt";
import { MarketplaceGuide } from "@/components/marketplace/MarketplaceGuide";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { Wine } from "lucide-react";
import { BulkWineFilterPanel } from "@/components/marketplace/BulkWineFilterPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getListings } from "@/lib/data/listings";
import { parseListingSearchParams } from "@/lib/search-params";
import { SaveSearchButton } from "@/components/marketplace/SaveSearchButton";
import { describeSearch, queryToFilters, sanitizeSearchParams } from "@/lib/alerts/query";
import { resolveViewerContext } from "@/lib/supabase/viewer";
import { flags } from "@/lib/flags";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Object.values(params).some((value) => (Array.isArray(value) ? value.length > 0 : !!value));
  const base = pageMetadata({
    title: "Bulk Wine for Sale by the Gallon | BWG",
    description:
      "Find bulk wine for sale, priced per gallon. Filter by varietal, vintage, ABV, region and farming practice. Confidential (NDA) lots available.",
    path: "/bulk-wine",
  });
  return filtered ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function BulkWinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Dark-launch: the section itself stays off the map while the flag is
  // off, same as /sell/bulk-wine.
  if (!flags.bulkWine) redirect("/grapes");

  const params = await searchParams;
  const filters = parseListingSearchParams(params);
  filters.listing_type = "bulk_wine";

  const [listings, viewer] = await Promise.all([getListings(filters), resolveViewerContext()]);
  const savedQuery = sanitizeSearchParams(params);
  const returnTo = savedQuery ? `/bulk-wine?${savedQuery}` : "/bulk-wine";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Bulk Wine for Sale", path: "/bulk-wine" },
        ])}
      />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Bulk Wine for Sale</h1>
          <p className="mt-1 text-sm text-stone-500">
            {listings.length} lot{listings.length === 1 ? "" : "s"} matching your search
          </p>
        </div>
        <SaveSearchButton
          key={savedQuery}
          listingType="bulk_wine"
          query={savedQuery}
          defaultName={describeSearch("bulk_wine", queryToFilters(savedQuery))}
          isLoggedIn={viewer.userId != null}
          returnTo={returnTo}
        />
      </div>

      <BrowseTopics />

      <div className="flex flex-col gap-8 lg:flex-row">
        <BulkWineFilterPanel />

        <div className="flex-1">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 py-20 text-center">
              <Wine className="size-10 text-stone-300" />
              <p className="mt-4 font-medium text-stone-700">No lots match these filters</p>
              <p className="mt-1 text-sm text-stone-500">Try widening your variety or wine location selection.</p>
              <PostRequestPrompt type="bulk_wine" variety={filters.variety} region={filters.region_ava} year={filters.vintage_year} />
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

      <MarketplaceGuide market="bulk-wine" />
    </div>
  );
}
