import Link from "next/link";
import { Grape, Pencil, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectSupabaseNotice } from "@/components/shared/ConnectSupabaseNotice";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatTons } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/types";

const STATUS_VARIANT: Record<ListingStatus, "neutral" | "brand" | "success" | "outline"> = {
  available: "success",
  pending: "brand",
  sold: "neutral",
  archived: "outline",
};

async function getMyListings(): Promise<{ connected: boolean; listings: Listing[] }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: true, listings: [] };

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { connected: true, listings: (data as Listing[]) ?? [] };
  } catch {
    return { connected: false, listings: [] };
  }
}

export default async function MyListingsPage() {
  const { connected, listings } = await getMyListings();

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">My Listings</h1>
          <p className="mt-1 text-sm text-stone-500">
            Everything you&apos;ve published — click a listing to fix a mistake or update pricing.
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/create">
            <PlusCircle className="size-4" /> Create Listing
          </Link>
        </Button>
      </div>

      {!connected && (
        <div className="mt-6">
          <ConnectSupabaseNotice />
        </div>
      )}

      {connected && listings.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Grape className="size-10 text-stone-300" />
          <p className="mt-4 font-medium text-stone-700">No listings yet</p>
          <p className="mt-1 text-sm text-stone-500">Publish your first grape lot to get started.</p>
        </div>
      )}

      <div className="mt-8 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}/edit`}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-stone-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-stone-900">{listing.title}</p>
                <Badge variant={STATUS_VARIANT[listing.status]} className="capitalize shrink-0">
                  {listing.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {listing.harvest_year} · {formatTons(listing.estimated_tons)} ·{" "}
                {formatCurrency(listing.price_per_ton)}/ton
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--color-brand)]">
              <Pencil className="size-3.5" /> Edit
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
