import Link from "next/link";
import { notFound } from "next/navigation";
import { Grape, MapPin, ShieldCheck, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getListingById } from "@/lib/data/listings";
import { formatCurrency, formatTons } from "@/lib/utils";

const PRACTICE_LABEL: Record<string, string> = {
  conventional: "Conventional",
  sustainable: "Sustainable (Certified)",
  organic: "Organic (Certified)",
  biodynamic: "Biodynamic (Certified)",
};

const SPEC_ROWS = (listing: NonNullable<Awaited<ReturnType<typeof getListingById>>>) => [
  ["Clone", listing.clone],
  ["Rootstock", listing.rootstock],
  ["Trellis System", listing.trellis_system],
  ["Soil Type", listing.soil_type],
  ["Sun Exposure", listing.sun_exposure],
  ["Slope", listing.slope_percent != null ? `${listing.slope_percent}%` : null],
  ["Brix Target", listing.brix_target != null ? `${listing.brix_target}°` : null],
  ["Minimum Order", formatTons(listing.minimum_tons)],
];

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/listings" className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> Back to all lots
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-50)] to-stone-100 bg-grain">
            <Grape className="size-16 text-[var(--color-brand)]/40" />
            <Badge variant="brand" className="absolute left-4 top-4">
              {listing.harvest_year} Harvest
            </Badge>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              {listing.variety}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-stone-900">{listing.title}</h1>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
              <MapPin className="size-4" />
              {listing.sub_ava ? `${listing.sub_ava}, ${listing.region_ava}` : listing.region_ava}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{PRACTICE_LABEL[listing.farming_practice]}</Badge>
              {listing.profiles?.is_verified && (
                <Badge variant="success">
                  <ShieldCheck className="size-3" /> Verified Grower
                </Badge>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-stone-600">{listing.description}</p>

            <Separator className="my-8" />

            <h2 className="font-semibold text-stone-900">Vineyard Detail</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {SPEC_ROWS(listing)
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-stone-900">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        <div>
          <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-2xl font-semibold text-stone-900">
              {formatCurrency(listing.price_per_ton)}
              <span className="text-sm font-normal text-stone-500"> / ton</span>
            </p>
            <p className="mt-1 text-sm text-stone-500">{formatTons(listing.estimated_tons)} available</p>

            <Separator className="my-5" />

            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Listed By</p>
            <p className="mt-1 font-medium text-stone-900">
              {listing.profiles?.company_name ?? "HarvestLink Grower"}
            </p>
            <p className="text-sm text-stone-500">{listing.profiles?.region_ava ?? listing.region_ava}</p>

            <Button asChild className="mt-6 w-full" size="lg">
              <Link href="/login">Sign In to Contact Grower</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
