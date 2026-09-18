import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getListingById } from "@/lib/data/listings";
import { resolveViewerContext } from "@/lib/supabase/viewer";
import { parseListingIdFromSlugParam, buildListingSlugPath } from "@/lib/utils";
import { buildListingMetadata } from "@/lib/listing-metadata";
import { ListingDetailContent } from "@/components/marketplace/ListingDetailContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return buildListingMetadata(slug, "grapes");
}

export default async function GrapesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseListingIdFromSlugParam(slug);
  const [listing, viewer] = await Promise.all([getListingById(id), resolveViewerContext()]);
  if (!listing) notFound();

  // WINE-1: type never changes after creation, so a bulk-wine listing
  // accessed under /grapes/... redirects to its real canonical section
  // rather than rendering there (keeps the two sections from mixing).
  if (listing.listing_type !== "grapes") {
    redirect(`/bulk-wine/${buildListingSlugPath(listing.title, listing.id)}`);
  }

  const canonicalSlug = buildListingSlugPath(listing.title, listing.id);
  if (slug !== canonicalSlug) {
    redirect(`/grapes/${canonicalSlug}`);
  }

  return <ListingDetailContent listing={listing} viewer={viewer} backHref="/grapes" backLabel="Back to all lots" />;
}
