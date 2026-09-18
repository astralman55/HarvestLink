import Link from "next/link";
import { ShieldCheck, Handshake, LineChart, Bell, ArrowRight } from "lucide-react";
import { GrapeSearchHero } from "@/components/marketplace/GrapeSearchHero";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getListings } from "@/lib/data/listings";
import { FEATURED_AVA_REGIONS } from "@/lib/constants/viticulture";

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Verified Growers",
    description: "Every listing traces back to a real vineyard operation, not an anonymous post.",
  },
  {
    icon: Handshake,
    title: "Direct Grower Pricing",
    description: "No forum middlemen — negotiate tonnage and price straight with the source.",
  },
  {
    icon: LineChart,
    title: "Forward Contract Planning",
    description: "Align on next year's blocks before harvest with the built-in crop planner.",
  },
  {
    icon: Bell,
    title: "Realtime Yield Alerts",
    description: "Get notified the moment fruit matching your spec hits the marketplace.",
  },
];

export default async function HomePage() {
  const featured = (await getListings({})).slice(0, 6);

  return (
    <>
      <section className="relative overflow-hidden border-b border-stone-200 bg-stone-50">
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-[var(--color-brand-50)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-dark)]">
              B2B Wine Grape Marketplace
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Source exceptional wine grapes, direct from growers.
            </h1>
            <p className="mt-4 text-lg text-stone-600">
              Search by region, variety, farming practice, and the vineyard-level detail that
              actually determines quality — trellis, soil, exposure, and slope.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl">
            <GrapeSearchHero />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand)]">
                <prop.icon className="size-5" />
              </span>
              <h3 className="font-semibold text-stone-900">{prop.title}</h3>
              <p className="text-sm text-stone-500">{prop.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">Featured Lots</h2>
              <p className="mt-1 text-sm text-stone-500">Fresh listings from growers across the country.</p>
            </div>
            <Link
              href="/listings"
              className="hidden items-center gap-1 text-sm font-medium text-[var(--color-brand)] sm:flex"
            >
              Browse all lots <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-8 sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/listings">Browse all lots</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-stone-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Browse by AVA Region</h2>
            <Link
              href="/listings"
              className="hidden text-sm font-medium text-[var(--color-brand)] sm:block"
            >
              See all regions →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FEATURED_AVA_REGIONS.map((region) => (
              <Link
                key={region}
                href={`/listings?region_ava=${encodeURIComponent(region)}`}
                className="rounded-xl border border-stone-200 bg-white px-4 py-3.5 text-sm font-medium text-stone-700 transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                {region}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-stone-900">How HarvestLink Works</h2>
          <Tabs defaultValue="buyers" className="mt-6 flex flex-col items-center">
            <TabsList>
              <TabsTrigger value="buyers">For Buyers</TabsTrigger>
              <TabsTrigger value="growers">For Growers</TabsTrigger>
            </TabsList>
            <TabsContent value="buyers" className="grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
              {[
                ["1. Search by spec", "Filter by region, variety, farming practice, trellis, soil, exposure, and slope."],
                ["2. Compare lots", "Review grower verification, pricing, tonnage, and brix targets side by side."],
                ["3. Lock in supply", "Connect directly with growers and plan multi-year forward contracts."],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="mt-2 text-sm text-stone-500">{body}</p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="growers" className="grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
              {[
                ["1. List your blocks", "Publish tonnage, pricing, and full vineyard detail in minutes."],
                ["2. Get discovered", "Verified buyers searching your region and variety find you instantly."],
                ["3. Plan ahead", "Use the crop planner to align next year's harvest with aligned buyers."],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="mt-2 text-sm text-stone-500">{body}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-[var(--color-brand)] py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Are you a grower? List your harvest.
          </h2>
          <p className="max-w-xl text-sm text-white/80">
            Reach verified buyers searching for your exact region, variety, and farming practice —
            and align future blocks with forward-contract planning.
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-2 bg-white text-[var(--color-brand)] hover:bg-white/90">
            <Link href="/register">Create a Grower Account</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
