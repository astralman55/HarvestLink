import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { RequestActions } from "@/components/wanted/RequestActions";
import { wantedHref } from "@/components/wanted/WantedCard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flags } from "@/lib/flags";
import { getWantedById, serializeWanted } from "@/lib/wanted/data";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function RequestResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  if (!flags.wanted) notFound();
  const { id } = await params;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect(`/login?redirect_to=${encodeURIComponent(`/requests/${id}`)}`);

  const found = await getWantedById(id);
  // A bad id and someone else's request look the same.
  if (!found || found.row.user_id !== user.id) notFound();
  const request = serializeWanted({ ...found.row, show_price: true }, null);
  const open = request.status === "open" && new Date(request.expires_at) > new Date();

  const admin = createAdminClient();
  const { data: responses } = await admin
    .from("wanted_responses")
    .select("id, responder_id, responder_anonymous, listing_id, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  const rows = (responses ?? []) as { id: string; responder_id: string; responder_anonymous: boolean; listing_id: string | null; created_at: string }[];
  const named = rows.filter((r) => !r.responder_anonymous).map((r) => r.responder_id);
  const { data: profiles } = named.length ? await admin.from("profiles").select("id, company_name, full_name").in("id", named) : { data: [] };
  const nameById = new Map((profiles ?? []).map((p: { id: string; company_name: string | null; full_name: string | null }) => [p.id, p.company_name || p.full_name || "Seller"]));

  return (
    <div className="max-w-3xl">
      <Link href="/requests" className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> My requests
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">{request.title}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {open ? `Open until ${dateFormat.format(new Date(request.expires_at))}` : request.status === "filled" ? "Filled" : request.status === "closed" ? "Closed" : "Expired"}
        {request.is_anonymous ? " · posted anonymously" : ""}
        {open && (
          <>
            {" · "}
            <Link href={wantedHref(request)} className="underline">
              public page
            </Link>
          </>
        )}
      </p>
      <div className="mt-3">
        <RequestActions id={id} open={request.status === "open"} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-stone-900">Responses ({rows.length})</h2>
      {rows.length === 0 ? (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-12 text-center">
          <MessageCircle className="size-9 text-stone-300" />
          <p className="mt-3 font-medium text-stone-700">No responses yet</p>
          <p className="mt-1 max-w-sm text-sm text-stone-500">Sellers with a matching lot are emailed, and you will get an email when someone responds.</p>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {rows.map((row) => (
            <Link key={row.id} href={`/responses/${row.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{row.responder_anonymous ? "Confidential Seller" : nameById.get(row.responder_id) ?? "Seller"}</p>
                <p className="mt-0.5 text-sm text-stone-500">
                  {dateFormat.format(new Date(row.created_at))}
                  {row.listing_id ? " · offered a lot" : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-[var(--color-brand)]">Open</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
