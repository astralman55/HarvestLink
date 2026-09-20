import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { WantedCard } from "@/components/wanted/WantedCard";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { GrapeVarietyOptionGroups, RegionOptionGroups } from "@/components/shared/SelectOptionGroups";
import { flags } from "@/lib/flags";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getOpenWanted } from "@/lib/wanted/data";
import type { WantedType } from "@/lib/wanted/schema";
import { GRAPE_VARIETIES, REGION_NAMES } from "@/lib/constants/viticulture";

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = ["type", "variety", "region"].some((key) => first(params[key]));
  const base = pageMetadata({
    title: "Wanted: Wine Grapes & Bulk Wine Buyers Are Looking For | BWG",
    description: "See the wine grapes and bulk wine buyers are looking for, and offer a lot. Post your own request and sellers reply through the site, anonymously if you prefer.",
    path: "/wanted",
  });
  return filtered ? { ...base, robots: { index: false, follow: true } } : base;
}

export default async function WantedPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!flags.wanted) notFound();
  const params = await searchParams;
  const type = first(params.type) === "grapes" || first(params.type) === "bulk_wine" ? (first(params.type) as WantedType) : undefined;
  const variety = GRAPE_VARIETIES.includes(first(params.variety)) ? first(params.variety) : undefined;
  const region = REGION_NAMES.includes(first(params.region)) ? first(params.region) : undefined;
  const requests = await getOpenWanted({ type, variety, region });

  const postParams = new URLSearchParams();
  if (type) postParams.set("type", type);
  if (variety) postParams.set("variety", variety);
  if (region) postParams.set("region", region);
  const postHref = `/wanted/new${postParams.size ? `?${postParams}` : ""}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Wanted", path: "/wanted" },
        ])}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Wanted</h1>
          <p className="mt-2 text-stone-600">
            Buyers post the wine grapes and bulk wine they are looking for. If you have a lot that fits, offer it. Everything happens through the site, and a buyer can stay anonymous until they choose otherwise.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={postHref}>
            <Megaphone /> Post what you&apos;re looking for
          </Link>
        </Button>
      </div>

      <form method="get" className="mt-8 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <Select name="type" defaultValue={type ?? ""} aria-label="Type">
          <option value="">Grapes and bulk wine</option>
          <option value="grapes">Grapes only</option>
          {flags.bulkWine && <option value="bulk_wine">Bulk wine only</option>}
        </Select>
        <Select name="variety" defaultValue={variety ?? ""} aria-label="Variety">
          <option value="">Any variety</option>
          <GrapeVarietyOptionGroups />
        </Select>
        <Select name="region" defaultValue={region ?? ""} aria-label="Region">
          <option value="">Any region</option>
          <RegionOptionGroups />
        </Select>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className="flex-1">
            Filter
          </Button>
          {(type || variety || region) && (
            <Button asChild variant="ghost">
              <Link href="/wanted">Clear</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-stone-500">
        {requests.length} open request{requests.length === 1 ? "" : "s"}
      </p>

      {requests.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-4 py-16 text-center">
          <Megaphone className="size-10 text-stone-300" />
          <p className="mt-4 font-medium text-stone-700">Nothing matches yet</p>
          <p className="mt-1 max-w-md text-sm text-stone-500">Be the first to post. Sellers with a matching lot are emailed, and you can ask to be emailed when a matching lot is listed.</p>
          <Button asChild className="mt-5">
            <Link href={postHref}>Post a request</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <WantedCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
