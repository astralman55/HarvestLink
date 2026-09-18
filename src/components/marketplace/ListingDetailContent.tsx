import Link from "next/link";
import { Grape, Wine, MapPin, ShieldCheck, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NdaBadge } from "@/components/marketplace/NdaBadge";
import { InquiryPanel } from "@/components/marketplace/InquiryPanel";
import { formatCurrency, formatCurrencyPrecise, formatTons, formatGallons, computeTotalLotValue } from "@/lib/utils";
import { flags } from "@/lib/flags";
import { BULK_WINE_FARMING_PRACTICES } from "@/lib/constants/bulk-wine";
import type { PublicListing, ViewerContext } from "@/lib/serializers/listing";

const PRACTICE_LABEL: Record<string, string> = {
  conventional: "Conventional",
  sustainable: "Sustainable (Certified)",
  organic: "Organic (Certified)",
  biodynamic: "Biodynamic (Certified)",
};

const BULK_WINE_PRACTICE_LABEL: Record<string, string> = Object.fromEntries(
  BULK_WINE_FARMING_PRACTICES.map((p) => [p.value, p.label])
);

const GRAPE_SPEC_ROWS = (listing: PublicListing) => [
  ["Clone", listing.clone],
  ["Rootstock", listing.rootstock],
  ["Trellis System", listing.trellis_system],
  ["Soil Type", listing.soil_type],
  ["Sun Exposure", listing.sun_exposure],
  ["Slope", listing.slope_percent != null ? `${listing.slope_percent}%` : null],
  ["Brix Target", listing.brix_target != null ? `${listing.brix_target}°` : null],
  ["Minimum Order", formatTons(listing.minimum_tons)],
  [
    "Vineyard",
    listing.single_vineyard ? (listing.vineyard_withheld ? "Single vineyard (name withheld)" : listing.vineyard_name) : null,
  ],
];

// WINE-4: "Wine specs" block -- vintage, ABV, total SO2, farming
// practices, wine location, grape origin, vineyard, quantity, price/gal,
// total lot value.
const WINE_SPEC_ROWS = (listing: PublicListing) => {
  const bw = listing.bulk_wine;
  if (!bw) return [];
  return [
    ["Vintage", bw.is_multi_vintage ? "Non-vintage / multi-vintage blend" : bw.vintage_year],
    ["ABV", `${bw.abv}%`],
    ["Total SO₂", bw.total_so2_ppm != null ? `${bw.total_so2_ppm} ppm` : "Not provided"],
    [
      "Wine Location",
      bw.wine_location_state ? `${bw.wine_location_county ? `${bw.wine_location_county}, ` : ""}${bw.wine_location_state}` : null,
    ],
    ["Grape Origin", listing.sub_ava ? `${listing.sub_ava}, ${listing.region_ava}` : listing.region_ava],
    [
      "Vineyard",
      listing.single_vineyard ? (listing.vineyard_withheld ? "Single vineyard (name withheld)" : listing.vineyard_name) : null,
    ],
  ];
};

interface ListingDetailContentProps {
  listing: PublicListing;
  viewer: ViewerContext;
  backHref: string;
  backLabel: string;
}

/** Shared by /grapes/[slug] and /bulk-wine/[slug] -- one component, branches on listing_type. */
export function ListingDetailContent({ listing, viewer, backHref, backLabel }: ListingDetailContentProps) {
  const isBulkWine = listing.listing_type === "bulk_wine";
  const bw = listing.bulk_wine;
  const totalLotValue = bw ? computeTotalLotValue(bw.quantity_gallons, bw.price_per_gallon) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={backHref} className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)] to-stone-100 bg-grain">
            {isBulkWine ? (
              <Wine className="size-16 text-[var(--color-brand)]/40" />
            ) : (
              <Grape className="size-16 text-[var(--color-brand)]/40" />
            )}
            <Badge variant="brand" className="absolute left-4 top-4">
              {isBulkWine ? (bw?.is_multi_vintage ? "NV" : bw?.vintage_year) : `${listing.harvest_year} Harvest`}
            </Badge>
            {listing.is_confidential && (
              <div className="absolute right-4 top-4">
                <NdaBadge />
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {listing.variety}
              {listing.is_confidential && <span className="ml-2 normal-case text-stone-500">Ref. {listing.reference_number}</span>}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-stone-900">{listing.title}</h1>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
              <MapPin className="size-4" />
              {listing.sub_ava ? `${listing.sub_ava}, ${listing.region_ava}` : listing.region_ava}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {isBulkWine
                ? bw?.farming_practices.map((code) => <Badge key={code} variant="outline">{BULK_WINE_PRACTICE_LABEL[code] ?? code}</Badge>)
                : <Badge variant="outline">{PRACTICE_LABEL[listing.farming_practice]}</Badge>}
              {listing.seller?.is_verified && (
                <Badge variant="success">
                  <ShieldCheck className="size-3" /> Verified Grower
                </Badge>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-stone-600">{listing.description}</p>

            <Separator className="my-8" />

            <h2 className="font-semibold text-stone-900">{isBulkWine ? "Wine Specs" : "Vineyard Detail"}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {(isBulkWine ? WINE_SPEC_ROWS(listing) : GRAPE_SPEC_ROWS(listing))
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-stone-900">{value}</dd>
                  </div>
                ))}
              {isBulkWine && totalLotValue != null && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total Lot Value</dt>
                  <dd className="mt-1 text-sm font-medium text-stone-900">≈ {formatCurrencyPrecise(totalLotValue)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div>
          <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6">
            {isBulkWine && bw ? (
              <>
                <p className="text-2xl font-semibold text-stone-900">
                  {formatCurrencyPrecise(bw.price_per_gallon)}
                  <span className="text-sm font-normal text-stone-500"> / gal</span>
                </p>
                <p className="mt-1 text-sm text-stone-500">{formatGallons(bw.quantity_gallons)} available</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-stone-900">
                  {formatCurrency(listing.price_per_ton)}
                  <span className="text-sm font-normal text-stone-500"> / ton</span>
                </p>
                <p className="mt-1 text-sm text-stone-500">{formatTons(listing.estimated_tons)} available</p>
              </>
            )}

            <Separator className="my-5" />

            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Listed By</p>
            <p className="mt-1 flex items-center gap-1.5 font-medium text-stone-900">
              {listing.is_confidential ? "Confidential Seller" : listing.seller?.company_name ?? "HarvestLink Grower"}
              {listing.is_confidential && <NdaBadge size="sm" />}
            </p>
            <p className="text-sm text-stone-500">
              {listing.is_confidential ? listing.region_ava : listing.seller?.region_ava ?? listing.region_ava}
            </p>

            {flags.ndaListings ? (
              <InquiryPanel
                listingId={listing.id}
                isConfidential={listing.is_confidential}
                isLoggedIn={viewer.userId != null}
                viewerIsOwner={listing.viewer_is_owner}
              />
            ) : (
              <Button asChild className="mt-6 w-full" size="lg">
                <Link href="/login">Sign In to Contact Grower</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
