import { notFound, permanentRedirect } from "next/navigation";
import { getListingById } from "@/lib/data/listings";
import { buildListingSlugPath } from "@/lib/utils";

// WINE-2: old /listings/{id} URLs must keep working. Which canonical
// section they redirect to depends on listing_type (a DB lookup), so this
// can't be expressed as a static rule in next.config.ts the way /listings
// and /listings/create are -- see docs/scope-addendum-decisions.md.
// permanentRedirect() issues a 308, the modern equivalent of a 301 that
// (unlike next.config.ts's redirects()) is available at request time.
export default async function LegacyListingDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const section = listing.listing_type === "bulk_wine" ? "bulk-wine" : "grapes";
  permanentRedirect(`/${section}/${buildListingSlugPath(listing.title, listing.id)}`);
}
