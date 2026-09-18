import { Grape } from "lucide-react";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { getListings } from "@/lib/data/listings";
import { parseListingSearchParams } from "@/lib/search-params";

export default async function GrapesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseListingSearchParams(await searchParams);
  filters.listing_type = "grapes";

  const listings = await getListings(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Browse Grape Lots</h1>
        <p className="mt-1 text-sm text-stone-500">
          {listings.length} lot{listings.length === 1 ? "" : "s"} matching your search
        </p>
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
    </div>
  );
}
