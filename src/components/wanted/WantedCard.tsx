import Link from "next/link";
import { Grape, ShieldQuestion, Wine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildListingSlugPath, formatCurrency } from "@/lib/utils";
import { formatQuantityRange, wantedPriceUnit } from "@/lib/wanted/schema";
import type { PublicWanted } from "@/lib/wanted/data";

export function wantedHref(request: Pick<PublicWanted, "title" | "id">): string {
  return `/wanted/${buildListingSlugPath(request.title, request.id)}`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function WantedCard({ request }: { request: PublicWanted }) {
  const bulk = request.request_type === "bulk_wine";
  const Icon = bulk ? Wine : Grape;
  return (
    <Link
      href={wantedHref(request)}
      className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="brand" className="gap-1">
          <Icon className="size-3.5" /> {bulk ? "Bulk wine" : "Grapes"}
        </Badge>
        <span className="text-xs text-stone-500">Posted {dateFormat.format(new Date(request.created_at))}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-stone-900 group-hover:text-[var(--color-brand)]">{request.variety}</h3>
      <p className="mt-1 text-sm font-medium text-stone-800">{formatQuantityRange(request.request_type, request.quantity_min, request.quantity_max)}</p>
      <dl className="mt-3 space-y-1 text-sm text-stone-600">
        <div>
          <dt className="sr-only">Regions</dt>
          <dd>{request.regions.length === 0 ? "Any region" : request.regions.join(", ")}</dd>
        </div>
        {request.year && (
          <div>
            <dt className="sr-only">{bulk ? "Vintage" : "Harvest year"}</dt>
            <dd>
              {request.year} {bulk ? "vintage" : "harvest"}
            </dd>
          </div>
        )}
        {request.max_price != null && (
          <div>
            <dt className="sr-only">Price</dt>
            <dd>Up to {formatCurrency(request.max_price)} per {wantedPriceUnit(request.request_type)}</dd>
          </div>
        )}
      </dl>
      {request.notes && <p className="mt-3 line-clamp-2 text-sm text-stone-500">{request.notes}</p>}
      <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-stone-500">
        {request.is_anonymous && <ShieldQuestion className="size-3.5" aria-hidden="true" />}
        {request.poster}
      </p>
    </Link>
  );
}
