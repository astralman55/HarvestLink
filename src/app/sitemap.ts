import type { MetadataRoute } from "next";
import { getListings } from "@/lib/data/listings";
import { getAllPosts } from "@/lib/blog";
import { ALL_LANDING_PAGES, landingPath } from "@/content/landing";
import { absoluteUrl } from "@/lib/seo";
import { buildListingSlugPath } from "@/lib/utils";

// 6.6/NDA-5: sitemap needs to become type-aware and NDA-safe. Titles are
// always server-generated from controlled fields (never the seller's own
// text -- docs/scope-addendum-decisions.md, Decision 17), so building a
// slug from listing.title carries no identity risk even for NDA listings.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (() => {
    try {
      return getAllPosts();
    } catch {
      return [];
    }
  })();
  const newestPost = posts.reduce((latest, post) => (post.dateModified > latest ? post.dateModified : latest), "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/grapes"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/bulk-wine"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/regions"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/varieties"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/blog"), lastModified: newestPost || undefined, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/sell"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.dateModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const landingRoutes: MetadataRoute.Sitemap = ALL_LANDING_PAGES.map((page) => ({
    url: absoluteUrl(landingPath(page)),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  let listings: Awaited<ReturnType<typeof getListings>> = [];
  try {
    listings = await getListings({});
  } catch {
    listings = [];
  }

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: absoluteUrl(`/${listing.listing_type === "bulk_wine" ? "bulk-wine" : "grapes"}/${buildListingSlugPath(listing.title, listing.id)}`),
    lastModified: listing.updated_at ?? listing.created_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...landingRoutes, ...postRoutes, ...listingRoutes];
}
