import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { REGION_PAGES, VARIETY_PAGES, landingPath } from "@/content/landing";
import { getAllPosts, formatPostDate, thumbFor } from "@/lib/blog";
import { CANONICAL_DESCRIPTION, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wine Grape & Bulk Wine Buying Guides | HarvestLink Blog",
  description:
    "Guides on how wine is made, terroir, Napa Valley, and how to buy and sell wine grapes and bulk wine: pricing, contracts, and farming practices.",
  path: "/blog",
});

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const categories = [...new Set(posts.map((post) => post.category))];
  const anchorFor = (category: string) => `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "The HarvestLink Blog",
            url: absoluteUrl("/blog"),
            description: "Guides on wine, wine grapes and bulk wine from HarvestLink.",
            hasPart: posts.map((post) => ({
              "@type": "BlogPosting",
              headline: post.title,
              url: absoluteUrl(`/blog/${post.slug}`),
              datePublished: post.datePublished,
              dateModified: post.dateModified,
              author: { "@type": "Person", name: post.author },
            })),
          },
        ]}
      />

      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">The HarvestLink Blog</h1>
        <p className="mt-3 text-lg text-stone-600">
          Plain-English guides on how wine is made, what makes a wine region special, and how to buy and sell wine grapes and
          bulk wine.
        </p>
        <p className="mt-2 text-sm text-stone-500">{CANONICAL_DESCRIPTION}</p>
      </header>

      <nav aria-label="Blog categories" className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Jump to a topic</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category}>
              <a
                href={`#${anchorFor(category)}`}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                {category}
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                  {posts.filter((post) => post.category === category).length}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {categories.map((category) => (
        <section key={category} id={anchorFor(category)} className="mt-12 scroll-mt-24" aria-labelledby={`${anchorFor(category)}-heading`}>
          <h2 id={`${anchorFor(category)}-heading`} className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            {category}
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {posts
              .filter((post) => post.category === category)
              .map((post) => (
                <article key={post.slug} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-md">
                  <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true" className="block">
                    <Image src={thumbFor(post)} alt="" width={640} height={320} unoptimized sizes="(min-width: 640px) 50vw, 100vw" className="h-auto w-full" />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold leading-snug text-stone-900">
                      <Link href={`/blog/${post.slug}`} className="hover:text-[var(--color-brand)]">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-stone-600">{post.description}</p>
                    <p className="mt-4 text-xs text-stone-500">
                      {post.author} · {formatPostDate(post.datePublished)} · {post.readingMinutes} min read
                    </p>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}

      <section className="mt-16 rounded-2xl border border-stone-200 bg-stone-50 p-6" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="text-xl font-semibold text-stone-900">
          Explore regions and varieties
        </h2>
        <p className="mt-1 text-sm text-stone-600">Facts, what to check before you buy or sell, and live lots for each.</p>
        {[
          { title: "Regions", all: "/regions", pages: REGION_PAGES },
          { title: "Varieties", all: "/varieties", pages: VARIETY_PAGES },
        ].map((group) => (
          <div key={group.title} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {group.title} ·{" "}
              <Link href={group.all} className="normal-case text-[var(--color-brand)] hover:underline">
                see all
              </Link>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={landingPath(page)}
                    className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
