import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestActions } from "@/components/wanted/RequestActions";
import { wantedHref } from "@/components/wanted/WantedCard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flags } from "@/lib/flags";
import { getOwnWanted } from "@/lib/wanted/data";
import { wantedTitle } from "@/lib/wanted/schema";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function MyRequestsPage({ searchParams }: { searchParams: Promise<{ posted?: string }> }) {
  if (!flags.wanted) notFound();
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect("/login?redirect_to=/requests");

  const { posted } = await searchParams;
  const admin = createAdminClient();
  const mine = await getOwnWanted(user.id);

  // Responses received (grouped by request) and responses this member has sent.
  const { data: received } = mine.length
    ? await admin.from("wanted_responses").select("id, request_id").in("request_id", mine.map((r) => r.id))
    : { data: [] as { id: string; request_id: string }[] };
  const receivedCount = new Map<string, number>();
  for (const row of received ?? []) receivedCount.set(row.request_id, (receivedCount.get(row.request_id) ?? 0) + 1);

  const { data: sent } = await admin
    .from("wanted_responses")
    .select("id, request_id, created_at")
    .eq("responder_id", user.id)
    .order("created_at", { ascending: false });
  const sentRequestIds = [...new Set((sent ?? []).map((s: { request_id: string }) => s.request_id))];
  const { data: sentRequests } = sentRequestIds.length
    ? await admin.from("wanted_requests").select("id, request_type, variety, regions, quantity_min, quantity_max, year").in("id", sentRequestIds)
    : { data: [] as never[] };
  const titleByRequest = new Map(
    (sentRequests ?? []).map((r: { id: string; request_type: "grapes" | "bulk_wine"; variety: string; regions: string[]; quantity_min: number; quantity_max: number | null; year: number | null }) => [
      r.id,
      wantedTitle({ ...r, quantity_min: Number(r.quantity_min), quantity_max: r.quantity_max == null ? null : Number(r.quantity_max) }),
    ])
  );

  const now = new Date();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">My requests</h1>
          <p className="mt-1 text-sm text-stone-500">What you are looking for, and the responses you have sent to other buyers.</p>
        </div>
        <Button asChild>
          <Link href="/wanted/new">
            <Megaphone /> New request
          </Link>
        </Button>
      </div>

      {posted === "1" && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Your request is live. Sellers with a matching lot will be emailed, and responses will show up here.
        </p>
      )}

      <section className="mt-8" aria-labelledby="mine-heading">
        <h2 id="mine-heading" className="text-lg font-semibold text-stone-900">
          Looking for
        </h2>
        {mine.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-stone-300 p-8 text-center">
            <p className="font-medium text-stone-700">No requests yet</p>
            <p className="mt-1 text-sm text-stone-500">Post what you need and sellers can find you.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {mine.map((request) => {
              const open = request.status === "open" && new Date(request.expires_at) > now;
              const status = request.status === "filled" ? "Filled" : request.status === "closed" ? "Closed" : open ? "Open" : "Expired";
              const count = receivedCount.get(request.id) ?? 0;
              return (
                <li key={request.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link href={`/requests/${request.id}`} className="min-w-0 font-medium text-stone-900 hover:text-[var(--color-brand)]">
                      {request.title}
                    </Link>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${open ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>{status}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {count} response{count === 1 ? "" : "s"}
                    {open ? ` · open until ${dateFormat.format(new Date(request.expires_at))}` : ""}
                    {request.is_anonymous ? " · anonymous" : ""}
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
                    <RequestActions id={request.id} open={request.status === "open"} expiresAt={request.expires_at} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="sent-heading">
        <h2 id="sent-heading" className="text-lg font-semibold text-stone-900">
          Responses I sent
        </h2>
        {(sent ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            You have not responded to any requests. <Link href="/wanted" className="font-medium text-[var(--color-brand)] underline">Browse requests</Link>
          </p>
        ) : (
          <div className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {(sent ?? []).map((row: { id: string; request_id: string }) => (
              <Link key={row.id} href={`/responses/${row.id}`} className="block p-4 hover:bg-stone-50">
                <p className="truncate font-medium text-stone-900">{titleByRequest.get(row.request_id) ?? "Request"}</p>
                <p className="mt-1 text-sm text-stone-500">Open conversation</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
