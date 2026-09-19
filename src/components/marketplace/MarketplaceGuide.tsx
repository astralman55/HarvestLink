import Link from "next/link";
import { FAQ_ITEMS } from "@/content/faq";

type Market = "grapes" | "bulk-wine";

const COPY: Record<
  Market,
  {
    heading: string;
    intro: string;
    pricingTitle: string;
    pricing: string;
    guides: { href: string; label: string }[];
    faq: string[];
  }
> = {
  grapes: {
    heading: "Buying wine grapes on BWG",
    intro:
      "Wine grapes on BWG are listed by the ton, direct from growers. Each lot shows the variety, harvest year, region, farming practice, estimated tons, minimum order, price per ton, and brix target, plus vineyard details such as trellis, soil, exposure, and slope. Sellers can list openly or confidentially under NDA. Use the filters to narrow by variety, region, and price, contact sellers through the site, and agree price, payment, and delivery directly with them. Save a search to get an email when new lots match.",
    pricingTitle: "How grape pricing works",
    pricing:
      "Wine grapes are priced per ton. Multiply the price per ton by the tons you want for a rough lot value. Final price and quality terms, such as the brix range and harvest timing, are agreed with the seller.",
    guides: [
      { href: "/blog/how-to-buy-wine-grapes", label: "How to buy wine grapes" },
      { href: "/blog/what-is-brix-in-winemaking", label: "What brix means at harvest" },
      { href: "/blog/gallons-of-wine-per-ton-of-grapes", label: "Gallons of wine per ton of grapes (calculator)" },
      { href: "/blog/spot-vs-forward-wine-grape-contracts", label: "Spot vs forward grape contracts" },
    ],
    faq: ["How are wine grapes priced?", "Does BWG charge fees?", "How do payment and delivery work?", "How do email alerts work?"],
  },
  "bulk-wine": {
    heading: "Buying bulk wine on BWG",
    intro:
      "Bulk wine on BWG is listed by the gallon, before bottling. Each lot shows the varietal, vintage, ABV, total sulfites in parts per million, region, wine location, farming practices, quantity, price per gallon, and total lot value. Sellers can list openly or confidentially under NDA, so some of the best lots never carry a winery name. Use the filters to narrow your search, contact sellers through the site, and arrange samples, lab analysis, payment, and transport directly with them. Save a search to get an email when new lots match.",
    pricingTitle: "How bulk wine pricing works",
    pricing:
      "Bulk wine is priced per gallon. Each listing multiplies quantity by price per gallon to show the total lot value. Price depends on varietal, vintage, appellation, quality, and market conditions, so compare lots on the same basis and ask each seller what the price includes.",
    guides: [
      { href: "/blog/what-is-bulk-wine", label: "What is bulk wine?" },
      { href: "/blog/how-to-buy-bulk-wine", label: "How to buy bulk wine" },
      { href: "/blog/how-to-start-a-wine-brand-without-a-vineyard", label: "Start a wine brand without a vineyard" },
      { href: "/blog/selling-wine-anonymously-nda-listings", label: "How confidential (NDA) listings work" },
    ],
    faq: ["What is bulk wine?", "How is bulk wine priced?", "Who can buy bulk wine?", "What does selling under NDA mean?"],
  },
};

/** Editorial content under the results grid, so the page has real text even when a search returns nothing. */
export function MarketplaceGuide({ market }: { market: Market }) {
  const copy = COPY[market];
  const faq = copy.faq.map((question) => FAQ_ITEMS.find((item) => item.q === question)).filter((item) => !!item);

  return (
    <section className="mt-14 border-t border-stone-200 pt-10" aria-labelledby={`${market}-guide`}>
      <h2 id={`${market}-guide`} className="text-xl font-semibold text-stone-900">
        {copy.heading}
      </h2>
      <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">{copy.intro}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="font-semibold text-stone-900">{copy.pricingTitle}</h3>
          <p className="mt-2 leading-relaxed text-stone-700">{copy.pricing}</p>
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Guides</h3>
          <ul className="mt-2 space-y-1.5">
            {copy.guides.map((guide) => (
              <li key={guide.href}>
                <Link href={guide.href} className="text-[var(--color-brand)] underline underline-offset-2">
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold text-stone-900">Common questions</h3>
        <dl className="mt-3 space-y-4">
          {faq.map((item) => (
            <div key={item.q}>
              <dt className="font-medium text-stone-900">{item.q}</dt>
              <dd className="mt-1 leading-relaxed text-stone-700">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm">
          <Link href="/faq" className="font-medium text-[var(--color-brand)] underline underline-offset-2">
            See all questions
          </Link>
        </p>
      </div>
    </section>
  );
}
