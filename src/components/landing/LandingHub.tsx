import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/JsonLd";
import { landingPath, type LandingPage } from "@/content/landing";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

interface LandingHubProps {
  title: string;
  intro: string;
  path: string;
  pages: readonly LandingPage[];
}

/** The /regions and /varieties index: a photo card per page, plus an ItemList for crawlers. */
export function LandingHub({ title, intro, path, pages }: LandingHubProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: title, path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: title,
            itemListElement: pages.map((page, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: page.name,
              url: absoluteUrl(landingPath(page)),
            })),
          },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-stone-600">{intro}</p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <li key={page.slug}>
            <Link href={landingPath(page)} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <Image
                src={page.image.replace(".webp", "-thumb.webp")}
                alt={page.imageAlt}
                width={640}
                height={320}
                unoptimized
                sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full"
              />
              <div className="p-4">
                <p className="font-semibold text-stone-900 group-hover:text-[var(--color-brand)]">{page.name}</p>
                <p className="mt-1 text-sm text-stone-600">{page.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
