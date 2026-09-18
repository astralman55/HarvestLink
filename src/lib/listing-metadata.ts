import type { Metadata } from "next";
import { getListingById } from "@/lib/data/listings";
import { parseListingIdFromSlugParam, buildListingSlugPath } from "@/lib/utils";

/**
 * NDA-5: per-listing title/description/canonical/OG tags, built from only
 * the fields that are always safe regardless of NDA status -- title is
 * server-generated (never seller text, Decision 17) and description is
 * covered by the NDA-6 free-text guard, so neither needs extra redaction
 * here. Never includes seller name, vineyard name, or any other identity
 * field. Shared by /grapes/[slug] and /bulk-wine/[slug].
 */
export async function buildListingMetadata(slugParam: string, section: "grapes" | "bulk-wine"): Promise<Metadata> {
  const id = parseListingIdFromSlugParam(slugParam);
  const listing = await getListingById(id);
  if (!listing) return {};

  const description = listing.description ? listing.description.slice(0, 155) : `${listing.title} on HarvestLink.`;
  const canonicalPath = `/${section}/${buildListingSlugPath(listing.title, listing.id)}`;

  return {
    title: listing.title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: listing.title,
      description,
      url: canonicalPath,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: listing.title,
      description,
    },
  };
}
