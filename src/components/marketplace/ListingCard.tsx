import Link from "next/link";
import { Grape, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTons } from "@/lib/utils";
import type { Listing } from "@/types";

const PRACTICE_LABEL: Record<string, string> = {
  conventional: "Conventional",
  sustainable: "Sustainable",
  organic: "Organic",
  biodynamic: "Biodynamic",
};

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[var(--color-brand-50)] to-stone-100 bg-grain">
        <Grape className="size-10 text-[var(--color-brand)]/40" />
        <Badge variant="brand" className="absolute left-3 top-3">
          {listing.harvest_year} Harvest
        </Badge>
        {listing.profiles?.is_verified && (
          <Badge variant="success" className="absolute right-3 top-3">
            <ShieldCheck className="size-3" /> Verified
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            {listing.profiles?.company_name ?? "HarvestLink Grower"}
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-stone-900">{listing.title}</h3>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          <MapPin className="size-3.5" />
          {listing.sub_ava ? `${listing.sub_ava}, ${listing.region_ava}` : listing.region_ava}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{PRACTICE_LABEL[listing.farming_practice]}</Badge>
          {listing.brix_target && <Badge variant="outline">{listing.brix_target}° Brix target</Badge>}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-lg font-semibold text-stone-900">
              {formatCurrency(listing.price_per_ton)}
              <span className="text-sm font-normal text-stone-500"> / ton</span>
            </p>
            <p className="text-xs text-stone-500">{formatTons(listing.estimated_tons)} available</p>
          </div>
          <span className="text-sm font-medium text-[var(--color-brand)] opacity-0 transition-opacity group-hover:opacity-100">
            View lot →
          </span>
        </div>
      </div>
    </Link>
  );
}
