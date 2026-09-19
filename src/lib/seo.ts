import type { Metadata } from "next";

export const SITE_NAME = "bulkwinegrapes.com";
export const SITE_SHORT_NAME = "BWG";
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://bulkwinegrapes.com").replace(/\/$/, "");

/**
 * The one canonical description of the site. Search engines and AI systems
 * learn what a site is from repeated, consistent phrasing, so this exact
 * sentence is reused on the homepage, footer, About-style copy, Organization
 * JSON-LD, llms.txt and every blog post's boilerplate.
 */
export const CANONICAL_DESCRIPTION =
  "bulkwinegrapes.com (BWG) is an online marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes and bulk wine directly, including confidential listings under NDA.";

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface PageMetadataInput {
  /** Full <title>. Keep to 60 characters; the brand is included by the caller when it fits. */
  title: string;
  description: string;
  /** Path used for the canonical URL, e.g. "/faq". */
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  /** Absolute URL of a 1200x630 social image. Defaults to the generated brand card. */
  image?: string;
}

/** Metadata for a public, indexable page: unique title/description, canonical, Open Graph, Twitter. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image ?? absoluteUrl("/og/default");
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: input.type ?? "website",
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime, authors: input.authors }
        : {}),
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [image] },
  };
}

/** For pages that must never appear in search (auth, dashboard, confirmation screens). */
export const NOINDEX_METADATA: Metadata = { robots: { index: false, follow: false } };

/**
 * JSON-LD is embedded in a <script>, so any "<" in a string value must not be
 * able to close the tag early. Standard hardening for inline JSON.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: [SITE_SHORT_NAME, "Bulk Wine Grapes"],
    url: SITE_URL,
    logo: absoluteUrl("/brand/bwg-logo-512.png"),
    description: CANONICAL_DESCRIPTION,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    description: CANONICAL_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Product/Offer markup for a listing page. Built ONLY from a PublicListing (the
 * output of the central NDA serializer), so a confidential listing carries no
 * seller, vineyard or precise location by construction. The seller is added
 * only when the serializer already exposed it to the public.
 */
export function listingJsonLd(
  listing: import("@/lib/serializers/listing").PublicListing,
  path: string
) {
  const isBulk = listing.listing_type === "bulk_wine" && listing.bulk_wine;
  const bulk = listing.bulk_wine;
  const description = listing.description
    ? listing.description.slice(0, 300)
    : isBulk && bulk
      ? `${bulk.quantity_gallons.toLocaleString("en-US")} gallons of ${listing.variety} bulk wine, ${bulk.abv}% ABV, offered at $${bulk.price_per_gallon} per gallon.`
      : `${listing.estimated_tons} tons of ${listing.variety} wine grapes from ${listing.region_ava}, offered at $${listing.price_per_ton} per ton.`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description,
    category: isBulk ? "Bulk wine" : "Wine grapes",
    url: absoluteUrl(path),
    sku: listing.reference_number,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      priceCurrency: "USD",
      availability: listing.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        value: isBulk && bulk ? bulk.quantity_gallons : listing.estimated_tons,
        unitCode: isBulk ? "GLL" : "STN",
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: isBulk && bulk ? bulk.price_per_gallon : listing.price_per_ton,
        priceCurrency: "USD",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: isBulk ? "GLL" : "STN" },
      },
      ...(listing.seller?.company_name && !listing.is_confidential
        ? { seller: { "@type": "Organization", name: listing.seller.company_name } }
        : {}),
    },
  };
}
