import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListingTitlesForViewer } from "@/lib/data/owner-listings";
import { ConnectSupabaseNotice } from "@/components/shared/ConnectSupabaseNotice";

interface InquiryRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
}

interface InquiryListItem {
  id: string;
  listingTitle: string;
  counterpartLabel: string;
  role: "buyer" | "seller";
}

async function getMyInquiries(): Promise<{ connected: boolean; userId: string | null; inquiries: InquiryListItem[] }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: true, userId: null, inquiries: [] };

    // Service role, scoped to this user's own threads: the API roles can't
    // read seller_id or listings.title any more (migration 0008 / Decision 46).
    // The title comes from the serializer so a buyer never sees the
    // sub-appellation of a confidential lot.
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("listing_inquiries")
      .select("id, listing_id, buyer_id, seller_id, created_at")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as InquiryRow[];
    const listingInfo = await getListingTitlesForViewer(
      rows.map((r) => r.listing_id),
      { userId: user.id, isAdmin: false }
    );
    const counterpartIds = [...new Set(rows.map((r) => (r.buyer_id === user.id ? r.seller_id : r.buyer_id)))];
    const { data: counterparts } = counterpartIds.length
      ? await supabase.from("profiles_inquiry_counterpart").select("id, company_name, full_name").in("id", counterpartIds)
      : { data: [] as { id: string; company_name: string | null; full_name: string | null }[] };
    const counterpartById = new Map((counterparts ?? []).map((c) => [c.id, c]));

    const inquiries: InquiryListItem[] = rows.map((row) => {
      const isBuyer = row.buyer_id === user.id;
      const counterpart = counterpartById.get(isBuyer ? row.seller_id : row.buyer_id);
      const listing = listingInfo.get(row.listing_id);
      const counterpartLabel =
        isBuyer && listing?.isNda
          ? "Confidential Seller"
          : counterpart?.company_name || counterpart?.full_name || (isBuyer ? "Seller" : "Buyer");

      return {
        id: row.id,
        listingTitle: listing?.title ?? "Listing",
        counterpartLabel,
        role: isBuyer ? "buyer" : "seller",
      };
    });

    return { connected: true, userId: user.id, inquiries };
  } catch {
    return { connected: false, userId: null, inquiries: [] };
  }
}

export default async function InquiriesPage() {
  const { connected, inquiries } = await getMyInquiries();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-900">Inquiries</h1>
      <p className="mt-1 text-sm text-stone-500">Messages between you and buyers or sellers on HarvestLink.</p>

      {!connected && (
        <div className="mt-6">
          <ConnectSupabaseNotice />
        </div>
      )}

      {connected && inquiries.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <MessageCircle className="size-10 text-stone-300" />
          <p className="mt-4 font-medium text-stone-700">No inquiries yet</p>
          <p className="mt-1 text-sm text-stone-500">Messages you send or receive about a listing will show up here.</p>
        </div>
      )}

      <div className="mt-8 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
        {inquiries.map((inquiry) => (
          <Link
            key={inquiry.id}
            href={`/inquiries/${inquiry.id}`}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-stone-50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{inquiry.listingTitle}</p>
              <p className="mt-1 text-sm text-stone-500">
                {inquiry.role === "buyer" ? "You contacted" : "From"} {inquiry.counterpartLabel}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
