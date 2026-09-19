import type { MetadataRoute } from "next";
import { getListings } from "@/lib/data/listings";
import { buildListingSlugPath } from "@/lib/utils";

// 6.6/NDA-5: sitemap needs to become type-aware and NDA-safe. Titles are
// always server-generated from controlled fields (never the seller's own
// text -- docs/scope-addendum-decisions.md, Decision 17), so building a
// slug from listing.title carries no identity risk even for NDA listings.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/grapes`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${appUrl}/bulk-wine`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${appUrl}/sell`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let listings: Awaited<ReturnType<typeof getListings>> = [];
  try {
    listings = await getListings({});
  } catch {
    listings = [];
  }

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${appUrl}/${listing.listing_type === "bulk_wine" ? "bulk-wine" : "grapes"}/${buildListingSlugPath(listing.title, listing.id)}`,
    lastModified: listing.created_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...listingRoutes];
}
