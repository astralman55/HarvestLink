import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListingTitlesForViewer } from "@/lib/data/owner-listings";
import { ReplyForm } from "./ReplyForm";

interface MessageRow {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

async function getThread(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { redirectToLogin: true as const };

  // Service role plus the explicit participant check below: the API roles
  // can no longer read seller_id / sender_id / listings.title (migration
  // 0008 / Decision 46). A non-participant or bad id both come back as "not
  // found", so we don't reveal which.
  const admin = createAdminClient();
  const { data: inquiry } = await admin.from("listing_inquiries").select("id, listing_id, buyer_id, seller_id").eq("id", id).maybeSingle();
  if (!inquiry || (inquiry.buyer_id !== user.id && inquiry.seller_id !== user.id)) {
    return { notFound: true as const };
  }

  const isBuyer = inquiry.buyer_id === user.id;
  const listing = (await getListingTitlesForViewer([inquiry.listing_id], { userId: user.id, isAdmin: false })).get(inquiry.listing_id);
  const counterpartId = isBuyer ? inquiry.seller_id : inquiry.buyer_id;

  const [{ data: messages }, { data: counterpart }] = await Promise.all([
    admin
      .from("listing_inquiry_messages")
      .select("id, sender_id, body, created_at")
      .eq("inquiry_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles_inquiry_counterpart").select("company_name, full_name").eq("id", counterpartId).maybeSingle(),
  ]);

  const counterpartLabel =
    isBuyer && listing?.isNda
      ? "Confidential Seller"
      : counterpart?.company_name || counterpart?.full_name || (isBuyer ? "Seller" : "Buyer");

  return {
    ok: true as const,
    userId: user.id,
    listingTitle: listing?.title ?? "Listing",
    listingId: inquiry.listing_id,
    counterpartLabel,
    messages: (messages ?? []) as MessageRow[],
  };
}

export default async function InquiryThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getThread(id);

  if ("redirectToLogin" in result) redirect(`/login?redirect_to=${encodeURIComponent(`/inquiries/${id}`)}`);
  if ("notFound" in result) notFound();

  const { userId, listingTitle, listingId, counterpartLabel, messages } = result;

  return (
    <div className="max-w-2xl">
      <Link href="/inquiries" className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> All inquiries
      </Link>

      <div className="mt-4">
        <h1 className="text-xl font-semibold text-stone-900">
          <Link href={`/listings/${listingId}`} className="hover:underline">
            {listingTitle}
          </Link>
        </h1>
        <p className="mt-1 text-sm text-stone-500">Conversation with {counterpartLabel}</p>
      </div>

      <div className="mt-6 space-y-3">
        {messages.map((message) => {
          const isMine = message.sender_id === userId;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine ? "bg-[var(--color-brand)] text-white" : "bg-stone-100 text-stone-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-stone-500"}`}>
                  {isMine ? "You" : counterpartLabel} · {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ReplyForm inquiryId={id} />
    </div>
  );
}
