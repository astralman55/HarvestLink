import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getListingById } from "@/lib/data/listings";
import { resolveViewerContext } from "@/lib/supabase/viewer";
import { parseListingIdFromSlugParam, buildListingSlugPath } from "@/lib/utils";
import { buildListingMetadata } from "@/lib/listing-metadata";
import { ListingDetailContent } from "@/components/marketplace/ListingDetailContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return buildListingMetadata(slug, "bulk-wine");
}

export default async function BulkWineDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseListingIdFromSlugParam(slug);
  const [listing, viewer] = await Promise.all([getListingById(id), resolveViewerContext()]);
  if (!listing) notFound();

  if (listing.listing_type !== "bulk_wine") {
    redirect(`/grapes/${buildListingSlugPath(listing.title, listing.id)}`);
  }

  const canonicalSlug = buildListingSlugPath(listing.title, listing.id);
  if (slug !== canonicalSlug) {
    redirect(`/bulk-wine/${canonicalSlug}`);
  }

  return <ListingDetailContent listing={listing} viewer={viewer} backHref="/bulk-wine" backLabel="Back to all lots" />;
}
