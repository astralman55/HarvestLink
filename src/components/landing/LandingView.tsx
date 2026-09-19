import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { SaveSearchButton } from "@/components/marketplace/SaveSearchButton";
import { Button } from "@/components/ui/button";
import { findLandingBySlug, landingFilter, landingPath, type LandingPage } from "@/content/landing";
import { describeSearch, queryToFilters, sanitizeSearchParams } from "@/lib/alerts/query";
import { getListings } from "@/lib/data/listings";
import { getPost } from "@/lib/blog";
import { flags } from "@/lib/flags";
import { CANONICAL_DESCRIPTION, absoluteUrl, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { resolveViewerContext } from "@/lib/supabase/viewer";

const SHOWN_PER_MARKET = 6;

/**
 * One region or variety page. The copy comes from src/content/landing; the lots are
 * live from the same public query the browse pages use, so NDA rules are unchanged.
 */
export async function LandingView({ page }: { page: LandingPage }) {
  const filter = landingFilter(page);
  const savedQuery = sanitizeSearchParams(filter as Record<string, string>);
  const bulkOn = flags.bulkWine;

  const [grapes, bulk, viewer] = await Promise.all([
    getListings({ ...filter, listing_type: "grapes" }),
    bulkOn ? getListings({ ...filter, listing_type: "bulk_wine" }) : Promise.resolve([]),
    resolveViewerContext(),
  ]);

  const isLoggedIn = viewer.userId != null;
  const parent = page.kind === "region" ? { name: "Regions", path: "/regions" } : { name: "Varieties", path: "/varieties" };
  const path = landingPath(page);
  const relatedPosts = page.related.map((slug) => getPost(slug)).filter((post) => post != null);
  const alsoSee = page.alsoSee.map((slug) => findLandingBySlug(slug)).filter((p) => p != null);

  const markets = [
    { key: "grapes" as const, title: "Wine grapes by the ton", lots: grapes, href: `/grapes?${savedQuery}`, empty: "No grape lots listed right now." },
    ...(bulkOn
      ? [{ key: "bulk_wine" as const, title: "Bulk wine by the gallon", lots: bulk, href: `/bulk-wine?${savedQuery}`, empty: "No bulk wine lots listed right now." }]
      : []),
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            parent,
            { name: page.name, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.h1,
            description: page.description,
            url: absoluteUrl(path),
            inLanguage: "en-US",
            image: absoluteUrl(page.image),
            isPartOf: { "@type": "WebSite", name: "HarvestLink", url: absoluteUrl("/") },
          },
          faqJsonLd(page.faq),
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-stone-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={parent.path} className="hover:text-stone-900">
              {parent.name}
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">{page.h1}</h1>
      </header>

      <figure className="mt-6 overflow-hidden rounded-2xl bg-stone-100">
        <Image src={page.image} alt={page.imageAlt} width={1200} height={600} priority unoptimized sizes="(min-width: 1152px) 1152px, 100vw" className="h-auto w-full" />
      </figure>

      <aside className="mt-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5" aria-label="Quick answer">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-dark)]">Quick answer</p>
        <p className="mt-1 text-stone-800">{page.quickAnswer}</p>
      </aside>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 text-stone-700">
          {page.intro.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        <aside aria-label={`${page.name} facts`} className="h-fit rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold text-stone-900">Key facts</p>
          <dl className="mt-3 space-y-3 text-sm">
            {page.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{fact.label}</dt>
                <dd className="mt-0.5 text-stone-800">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {markets.map((market) => (
        <section key={market.key} className="mt-12" aria-labelledby={`lots-${market.key}`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id={`lots-${market.key}`} className="text-2xl font-semibold text-stone-900">
                {market.title}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {market.lots.length} {page.name} lot{market.lots.length === 1 ? "" : "s"} listed
              </p>
            </div>
            <SaveSearchButton
              listingType={market.key}
              query={savedQuery}
              defaultName={describeSearch(market.key, queryToFilters(savedQuery))}
              isLoggedIn={isLoggedIn}
              returnTo={path}
            />
          </div>

          {market.lots.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 p-8 text-center">
              <p className="font-medium text-stone-700">{market.empty}</p>
              <p className="mt-1 text-sm text-stone-500">Save this search and we will email you once a day when a new one appears.</p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {market.lots.slice(0, SHOWN_PER_MARKET).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {market.lots.length > SHOWN_PER_MARKET && (
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href={market.href}>See all {market.lots.length} lots</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      ))}

      <section className="mt-12" aria-labelledby="buyer-notes">
        <h2 id="buyer-notes" className="text-2xl font-semibold text-stone-900">
          What to check before you buy or sell
        </h2>
        <ul className="mt-4 space-y-3">
          {page.buyerNotes.map((note) => (
            <li key={note} className="rounded-xl border border-stone-200 bg-white p-4 text-stone-700">
              {note}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold text-stone-900">
          Frequently asked questions
        </h2>
        <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {page.faq.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium text-stone-900 marker:hidden">{item.q}</summary>
              <p className="mt-2 text-stone-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {relatedPosts.length > 0 && (
        <section className="mt-12" aria-labelledby="guides-heading">
          <h2 id="guides-heading" className="text-2xl font-semibold text-stone-900">
            Guides that help
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {relatedPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="block h-full rounded-xl border border-stone-200 bg-white p-4 hover:border-[var(--color-brand)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">{post.category}</p>
                  <p className="mt-1 font-medium text-stone-900">{post.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {alsoSee.length > 0 && (
        <section className="mt-12" aria-labelledby="also-heading">
          <h2 id="also-heading" className="text-2xl font-semibold text-stone-900">
            Related regions and varieties
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {alsoSee.map((other) => (
              <Link
                key={other.slug}
                href={landingPath(other)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                {other.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-5" aria-label="Sources">
        <p className="text-sm font-semibold text-stone-900">Sources</p>
        <ul className="mt-2 space-y-1 text-sm">
          {page.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--color-brand)] hover:underline">
                {source.title} <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-500">
          Figures come from the sources above and change over time. Educational information, not legal, tax or financial advice.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5" aria-label="About HarvestLink">
        <p className="text-sm font-semibold text-stone-900">About HarvestLink</p>
        <p className="mt-1 text-sm text-stone-600">{CANONICAL_DESCRIPTION}</p>
      </section>
    </article>
  );
}
