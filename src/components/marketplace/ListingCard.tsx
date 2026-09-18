import Link from "next/link";
import { Grape, Wine, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NdaBadge } from "@/components/marketplace/NdaBadge";
import { formatCurrency, formatCurrencyPrecise, formatTons, formatGallons, buildListingSlugPath } from "@/lib/utils";
import { BULK_WINE_FARMING_PRACTICES } from "@/lib/constants/bulk-wine";
import type { PublicListing } from "@/lib/serializers/listing";

const PRACTICE_LABEL: Record<string, string> = {
  conventional: "Conventional",
  sustainable: "Sustainable",
  organic: "Organic",
  biodynamic: "Biodynamic",
};

const BULK_WINE_PRACTICE_LABEL: Record<string, string> = Object.fromEntries(
  BULK_WINE_FARMING_PRACTICES.map((p) => [p.value, p.label])
);

export function ListingCard({ listing }: { listing: PublicListing }) {
  const isBulkWine = listing.listing_type === "bulk_wine";
  const bw = listing.bulk_wine;

  const sectionPath = isBulkWine ? "bulk-wine" : "grapes";

  return (
    <Link
      href={`/${sectionPath}/${buildListingSlugPath(listing.title, listing.id)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[var(--color-brand-50)] to-stone-100 bg-grain">
        {isBulkWine ? (
          <Wine className="size-10 text-[var(--color-brand)]/40" />
        ) : (
          <Grape className="size-10 text-[var(--color-brand)]/40" />
        )}
        <Badge variant="brand" className="absolute left-3 top-3">
          {isBulkWine ? (bw?.is_multi_vintage ? "NV" : bw?.vintage_year) : `${listing.harvest_year} Harvest`}
        </Badge>
        {listing.seller?.is_verified && (
          <Badge variant="success" className="absolute right-3 top-3">
            <ShieldCheck className="size-3" /> Verified
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              {listing.is_confidential ? "Confidential Seller" : listing.seller?.company_name ?? "HarvestLink Grower"}
            </p>
            {listing.is_confidential && <NdaBadge size="sm" interactive={false} />}
          </div>
          <h3 className="mt-1 line-clamp-2 font-semibold text-stone-900">{listing.title}</h3>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin className="size-3.5" />
          {isBulkWine && bw?.wine_location_state
            ? `${bw.wine_location_county ? `${bw.wine_location_county}, ` : ""}${bw.wine_location_state}`
            : listing.sub_ava
              ? `${listing.sub_ava}, ${listing.region_ava}`
              : listing.region_ava}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {isBulkWine ? (
            <>
              {bw && <Badge variant="outline">{bw.abv}% ABV</Badge>}
              {bw?.farming_practices.map((code) => (
                <Badge key={code} variant="outline">
                  {BULK_WINE_PRACTICE_LABEL[code] ?? code}
                </Badge>
              ))}
            </>
          ) : (
            <>
              <Badge variant="outline">{PRACTICE_LABEL[listing.farming_practice]}</Badge>
              {listing.brix_target && <Badge variant="outline">{listing.brix_target}° Brix target</Badge>}
            </>
          )}
          {listing.single_vineyard && (
            <Badge variant="outline">Vineyard: {listing.vineyard_withheld ? "name withheld" : listing.vineyard_name}</Badge>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {isBulkWine && bw ? (
              <>
                <p className="text-lg font-semibold text-stone-900">
                  {formatCurrencyPrecise(bw.price_per_gallon)}
                  <span className="text-sm font-normal text-stone-500"> / gal</span>
                </p>
                <p className="text-xs text-stone-500">{formatGallons(bw.quantity_gallons)} available</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-stone-900">
                  {formatCurrency(listing.price_per_ton)}
                  <span className="text-sm font-normal text-stone-500"> / ton</span>
                </p>
                <p className="text-xs text-stone-500">{formatTons(listing.estimated_tons)} available</p>
              </>
            )}
          </div>
          <span className="text-sm font-medium text-[var(--color-brand)] opacity-0 transition-opacity group-hover:opacity-100">
            View lot →
          </span>
        </div>
      </div>
    </Link>
  );
}
