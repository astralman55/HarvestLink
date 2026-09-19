import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { GallonsCalculator } from "@/components/blog/GallonsCalculator";
import { Button } from "@/components/ui/button";
import { formatPostDate, getAllPosts, getPost, getRelatedPosts } from "@/lib/blog";
import { CANONICAL_DESCRIPTION, SITE_NAME, absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    ...pageMetadata({
      title: post.metaTitle,
      description: post.description,
      path: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [post.author],
      image: absoluteUrl(`/og/blog/${post.slug}`),
    }),
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`),
      // A clean Markdown copy for AI agents and readers who prefer it.
      types: { "text/markdown": absoluteUrl(`/blog/${post.slug}.md`) },
    },
    keywords: [post.primaryKeyword, ...post.secondaryKeywords],
  };
}

const WIDGETS: Record<string, () => React.JSX.Element> = {
  "gallons-calculator": () => <GallonsCalculator />,
};

const CTA_COPY = {
  "bulk-wine": { href: "/bulk-wine", label: "Browse bulk wine", text: "See bulk wine lots priced per gallon, including confidential listings." },
  grapes: { href: "/grapes", label: "Browse wine grapes", text: "See wine grape lots priced per ton, direct from growers." },
  sell: { href: "/sell", label: "List your grapes or wine", text: "List openly or confidentially under NDA and get inquiries through the site." },
} as const;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);
  const cta = CTA_COPY[post.cta];
  const url = absoluteUrl(`/blog/${post.slug}`);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            mainEntityOfPage: url,
            url,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            wordCount: post.wordCount,
            articleSection: post.category,
            keywords: [post.primaryKeyword, ...post.secondaryKeywords].join(", "),
            inLanguage: "en-US",
            image: [absoluteUrl(post.heroImage), absoluteUrl(`/og/blog/${post.slug}`)],
            author: { "@type": "Person", name: post.author },
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/"), logo: { "@type": "ImageObject", url: absoluteUrl("/brand/harvestlink-logo-512.png") } },
          },
          faqJsonLd(post.faq),
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
            <Link href="/blog" className="hover:text-stone-900">
              Blog
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">{post.category}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">{post.title}</h1>
        <p className="mt-4 text-sm text-stone-500">
          By <span className="font-medium text-stone-700">{post.author}</span> · Published{" "}
          <time dateTime={post.datePublished}>{formatPostDate(post.datePublished)}</time>
          {post.dateModified !== post.datePublished && (
            <>
              {" "}
              · Last updated <time dateTime={post.dateModified}>{formatPostDate(post.dateModified)}</time>
            </>
          )}{" "}
          · {post.readingMinutes} min read
        </p>
      </header>

      <figure className="mt-6 overflow-hidden rounded-2xl bg-stone-100">
        <Image
          src={post.heroImage}
          alt={post.heroAlt}
          width={1200}
          height={600}
          priority
          unoptimized
          sizes="(min-width: 768px) 768px, 100vw"
          className="h-auto w-full"
        />
      </figure>

      <aside className="mt-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5" aria-label="Quick answer">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-dark)]">Quick answer</p>
        <p className="mt-1 text-stone-800">{post.quickAnswer}</p>
      </aside>

      {post.toc.length >= 4 && (
        <nav aria-label="Table of contents" className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-sm font-semibold text-stone-900">In this guide</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {post.toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-[var(--color-brand)] hover:underline">
                  {item.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-8">
        {post.htmlParts.map((html, index) => {
          const Widget = post.widgets[index] ? WIDGETS[post.widgets[index]] : undefined;
          return (
            <div key={index}>
              <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />
              {Widget && <div className="my-8">{Widget()}</div>}
            </div>
          );
        })}
      </div>

      <section className="mt-12 rounded-2xl bg-[var(--color-brand)] p-6 text-white" aria-label="Next step">
        <p className="text-lg font-semibold">{cta.text}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="secondary" className="bg-white text-[var(--color-brand)] hover:bg-white/90">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
          {post.cta !== "sell" && (
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              <Link href="/alerts">
                <Bell /> Get email alerts for new lots
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold text-stone-900">
          Frequently asked questions
        </h2>
        <div className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {post.faq.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium text-stone-900 marker:hidden">{item.q}</summary>
              <p className="mt-2 text-stone-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-5" aria-label="About HarvestLink">
        <p className="text-sm font-semibold text-stone-900">About HarvestLink</p>
        <p className="mt-1 text-sm text-stone-600">{CANONICAL_DESCRIPTION}</p>
        <p className="mt-3 text-xs text-stone-500">
          Educational information, not legal, tax, or financial advice. Confirm permit and licensing requirements with the
          relevant agencies or a qualified professional.
        </p>
      </section>

      {post.sources.length > 0 && (
        <section className="mt-10" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-lg font-semibold text-stone-900">
            Sources
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-600">
            {post.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noopener" target="_blank" className="text-[var(--color-brand)] underline">
                  {source.title}
                </a>{" "}
                <span className="text-stone-500">(accessed {source.accessed})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-lg font-semibold text-stone-900">
          Keep reading
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {related.map((item) => (
            <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-xl border border-stone-200 bg-white p-4 text-sm font-medium text-stone-900 transition-shadow hover:shadow-md">
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
