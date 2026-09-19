import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_ITEMS } from "@/content/faq";
import { CANONICAL_DESCRIPTION, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "HarvestLink FAQ | Bulk Wine & Wine Grape Questions",
  description: "Answers about bulk wine, wine grape pricing, NDA listings, email alerts, and how to buy or sell on HarvestLink.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />

      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Frequently Asked Questions</h1>
      <p className="mt-3 text-stone-600">{CANONICAL_DESCRIPTION}</p>

      <div className="mt-10 space-y-8">
        {FAQ_ITEMS.map((item) => (
          <section key={item.q} aria-labelledby={`q-${FAQ_ITEMS.indexOf(item)}`}>
            <h2 id={`q-${FAQ_ITEMS.indexOf(item)}`} className="text-lg font-semibold text-stone-900">
              {item.q}
            </h2>
            <p className="mt-2 leading-relaxed text-stone-700">{item.a}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
        <p>
          Want more detail? Read the guides on{" "}
          <Link href="/blog/what-is-bulk-wine" className="font-medium text-[var(--color-brand)] underline">
            what bulk wine is
          </Link>
          ,{" "}
          <Link href="/blog/how-to-buy-bulk-wine" className="font-medium text-[var(--color-brand)] underline">
            how to buy it
          </Link>
          , and{" "}
          <Link href="/blog/how-to-buy-wine-grapes" className="font-medium text-[var(--color-brand)] underline">
            how to buy wine grapes
          </Link>
          , or browse the{" "}
          <Link href="/blog" className="font-medium text-[var(--color-brand)] underline">
            full blog
          </Link>
          . This page is general information, not legal or financial advice.
        </p>
      </div>
    </div>
  );
}
