import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditListingForm } from "./edit-form";
import { BulkWineEditForm } from "./bulk-wine-edit-form";
import type { Listing } from "@/types";

async function getOwnedListing(id: string): Promise<Listing | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("listings")
    .select("*, bulk_wine_details(*), listing_farming_practices(practice_code)")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  // Don't reveal that a listing exists to anyone but its owner.
  if (data.user_id !== user.id) return null;

  const listing = data as Listing;

  // Owner-only winemaker table (migration 0007). Not having run it yet, or
  // no winemaker being set, both just leave the field blank.
  if (listing.listing_type === "bulk_wine" && listing.bulk_wine_details) {
    const { data: winemaker } = await supabase.from("listing_winemakers").select("winemaker_name").eq("listing_id", id).maybeSingle();
    listing.bulk_wine_details.winemaker_name = winemaker?.winemaker_name ?? null;
  }

  return listing;
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getOwnedListing(id);
  if (!listing) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/listings/mine" className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> Back to my listings
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-stone-900">Edit Listing</h1>
      <p className="mt-1 text-sm text-stone-500">{listing.title}</p>

      {listing.listing_type === "bulk_wine" ? <BulkWineEditForm listing={listing} /> : <EditListingForm listing={listing} />}
    </div>
  );
}
