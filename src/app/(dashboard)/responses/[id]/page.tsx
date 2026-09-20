import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThreadReplyForm } from "@/components/wanted/ThreadReplyForm";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flags } from "@/lib/flags";
import { getListingTitlesForViewer } from "@/lib/data/owner-listings";
import { serializeWanted } from "@/lib/wanted/data";
import { getThreadAccess } from "@/lib/wanted/threads";
import { wantedHref } from "@/components/wanted/WantedCard";
import { buildListingSlugPath } from "@/lib/utils";

export default async function ResponseThreadPage({ params }: { params: Promise<{ id: string }> }) {
  if (!flags.wanted) notFound();
  const { id } = await params;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect(`/login?redirect_to=${encodeURIComponent(`/responses/${id}`)}`);

  // Only the request's poster and the responder get past this; everyone else sees "not found".
  const access = await getThreadAccess(id, user.id);
  if (!access) notFound();
  const { response, request, role } = access;

  const admin = createAdminClient();
  const [{ data: messages }, counterpartProfile] = await Promise.all([
    admin.from("wanted_messages").select("id, sender_id, body, created_at").eq("response_id", id).order("created_at", { ascending: true }),
    (async () => {
      // Who the member is talking to, honouring whichever side chose to stay anonymous.
      if (role === "poster") {
        if (response.responder_anonymous) return "Confidential Seller";
        const { data } = await admin.from("profiles").select("company_name, full_name").eq("id", response.responder_id).maybeSingle();
        return data?.company_name || data?.full_name || "Seller";
      }
      if (request.is_anonymous) return "Anonymous buyer";
      const { data } = await admin.from("profiles").select("company_name, full_name").eq("id", request.user_id).maybeSingle();
      return data?.company_name || data?.full_name || "Buyer";
    })(),
  ]);

  const view = serializeWanted({ ...request, show_price: true }, null);

  // The lot the responder offered, titled for whoever is looking (a confidential lot's hidden detail stays hidden from the buyer).
  let lot: { title: string; href: string } | null = null;
  if (response.listing_id) {
    const info = (await getListingTitlesForViewer([response.listing_id], { userId: user.id, isAdmin: false })).get(response.listing_id);
    if (info) {
      const { data: listing } = await admin.from("listings").select("listing_type").eq("id", response.listing_id).maybeSingle();
      lot = { title: info.title, href: `/${listing?.listing_type === "bulk_wine" ? "bulk-wine" : "grapes"}/${buildListingSlugPath(info.title, response.listing_id)}` };
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href={role === "poster" ? `/requests/${request.id}` : "/requests"} className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> {role === "poster" ? "All responses" : "My requests"}
      </Link>

      <div className="mt-4">
        <h1 className="text-xl font-semibold text-stone-900">
          {role === "responder" ? (
            <Link href={wantedHref(view)} className="hover:underline">
              {view.title}
            </Link>
          ) : (
            view.title
          )}
        </h1>
        <p className="mt-1 text-sm text-stone-500">Conversation with {counterpartProfile}</p>
      </div>

      {lot && (
        <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          Offered lot:{" "}
          <Link href={lot.href} className="font-medium text-[var(--color-brand)] underline">
            {lot.title}
          </Link>
        </p>
      )}

      <div className="mt-6 space-y-3">
        {(messages ?? []).map((message: { id: string; sender_id: string; body: string; created_at: string }) => {
          const isMine = message.sender_id === user.id;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-[var(--color-brand)] text-white" : "bg-stone-100 text-stone-800"}`}>
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-stone-500"}`}>
                  {isMine ? "You" : counterpartProfile} · {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ThreadReplyForm responseId={id} />
    </div>
  );
}
