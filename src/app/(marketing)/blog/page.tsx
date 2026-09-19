import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllPosts, formatPostDate } from "@/lib/blog";
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

      {categories.map((category) => (
        <section key={category} className="mt-12" aria-labelledby={`cat-${category}`}>
          <h2 id={`cat-${category}`} className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            {category}
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {posts
              .filter((post) => post.category === category)
              .map((post) => (
                <article key={post.slug} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md">
                  <h3 className="text-lg font-semibold leading-snug text-stone-900">
                    <Link href={`/blog/${post.slug}`} className="hover:text-[var(--color-brand)]">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-stone-600">{post.description}</p>
                  <p className="mt-4 text-xs text-stone-500">
                    {post.author} · {formatPostDate(post.datePublished)} · {post.readingMinutes} min read
                  </p>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
