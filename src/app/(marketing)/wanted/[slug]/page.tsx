import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShieldQuestion } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { RespondForm } from "@/components/wanted/RespondForm";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { flags } from "@/lib/flags";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { formatCurrency, parseListingIdFromSlugParam } from "@/lib/utils";
import { resolveViewerContext } from "@/lib/supabase/viewer";
import { getWantedById } from "@/lib/wanted/data";
import { getOwnAvailableLots } from "@/lib/wanted/own-listings";
import { formatQuantityRange, wantedPriceUnit } from "@/lib/wanted/schema";

// Open or closed, this page depends on the viewer and on live status.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const isOpen = (status: string, expiresAt: string) => status === "open" && new Date(expiresAt) > new Date();

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  if (!flags.wanted) return {};
  const { slug } = await params;
  const found = await getWantedById(parseListingIdFromSlugParam(slug));
  if (!found) return {};
  const { view } = found;
  const short = view.title.length > 50 ? `${view.title.slice(0, 49)}…` : view.title;
  const base = pageMetadata({
    title: `${short} | BWG`,
    description: `${view.poster} is looking for ${formatQuantityRange(view.request_type, view.quantity_min, view.quantity_max)} of ${view.variety}. Offer a lot through bulkwinegrapes.com.`.slice(0, 155),
    path: `/wanted/${slug}`,
  });
  // A request that has closed or expired should drop out of search.
  return isOpen(view.status, view.expires_at) ? base : { ...base, robots: { index: false, follow: true } };
}

export default async function WantedDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!flags.wanted) notFound();
  const { slug } = await params;
  const found = await getWantedById(parseListingIdFromSlugParam(slug));
  if (!found) notFound();
  const { row, view } = found;
  const open = isOpen(view.status, view.expires_at);
  const bulk = view.request_type === "bulk_wine";

  const viewer = await resolveViewerContext();
  const isOwner = viewer.userId != null && viewer.userId === row.user_id;

  let existingResponseId: string | null = null;
  let lots: Awaited<ReturnType<typeof getOwnAvailableLots>> = [];
  if (viewer.userId && !isOwner && open) {
    const { data } = await createAdminClient()
      .from("wanted_responses")
      .select("id")
      .eq("request_id", row.id)
      .eq("responder_id", viewer.userId)
      .maybeSingle();
    existingResponseId = data?.id ?? null;
    if (!existingResponseId) lots = await getOwnAvailableLots(viewer.userId, view.request_type);
  }

  const facts: { label: string; value: string }[] = [
    { label: "Looking for", value: `${view.variety} ${bulk ? "bulk wine" : "grapes"}` },
    { label: "Quantity", value: formatQuantityRange(view.request_type, view.quantity_min, view.quantity_max) },
    { label: "Regions", value: view.regions.length === 0 ? "Any region" : view.regions.join(", ") },
    ...(view.year ? [{ label: bulk ? "Vintage" : "Harvest year", value: String(view.year) }] : []),
    ...(view.farming_practice ? [{ label: "Farming practice", value: view.farming_practice[0].toUpperCase() + view.farming_practice.slice(1) }] : []),
    ...(view.max_price != null ? [{ label: "Price", value: `Up to ${formatCurrency(view.max_price)} per ${wantedPriceUnit(view.request_type)}` }] : []),
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Wanted", path: "/wanted" },
          { name: view.variety, path: `/wanted/${slug}` },
        ])}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <Link href="/wanted" className="hover:text-stone-900">
          ← All requests
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl">{view.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
          {view.is_anonymous && <ShieldQuestion className="size-4" aria-hidden="true" />}
          {view.poster} &middot; Posted {dateFormat.format(new Date(view.created_at))}
          {open && <> &middot; Open until {dateFormat.format(new Date(view.expires_at))}</>}
        </p>
      </header>

      {!open && (
        <p role="status" className="mt-6 rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700">
          {view.status === "filled" ? "This request has been filled." : "This request is closed."}{" "}
          <Link href="/wanted" className="font-medium underline">
            See open requests
          </Link>
        </p>
      )}

      <dl className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{fact.label}</dt>
            <dd className="mt-0.5 text-stone-900">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {view.notes && (
        <section className="mt-6" aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="text-sm font-semibold text-stone-900">
            Notes from the buyer
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-stone-700">{view.notes}</p>
        </section>
      )}

      {open && (
        <section className="mt-10 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5 sm:p-6" aria-labelledby="respond-heading">
          <h2 id="respond-heading" className="text-lg font-semibold text-stone-900">
            I can supply this
          </h2>
          {isOwner ? (
            <div className="mt-2">
              <p className="text-stone-700">This is your request.</p>
              <Button asChild className="mt-3" variant="outline">
                <Link href={`/requests/${row.id}`}>See responses</Link>
              </Button>
            </div>
          ) : !viewer.userId ? (
            <div className="mt-2">
              <p className="text-stone-700">Log in or create a free account to offer a lot. You can respond confidentially.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/login?redirect_to=${encodeURIComponent(`/wanted/${slug}`)}`}>Log in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/register?redirect_to=${encodeURIComponent(`/wanted/${slug}`)}`}>Create an account</Link>
                </Button>
              </div>
            </div>
          ) : existingResponseId ? (
            <div className="mt-2">
              <p className="text-stone-700">You have already responded to this request.</p>
              <Button asChild className="mt-3">
                <Link href={`/responses/${existingResponseId}`}>Open the conversation</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <RespondForm requestId={row.id} listings={lots} redirectPath={`/wanted/${slug}`} />
            </div>
          )}
        </section>
      )}

      <p className="mt-8 text-xs text-stone-500">
        BWG does not set prices, take fees or handle payment. Buyers and sellers agree on terms directly. Confirm any permit or licensing requirements before you buy or sell bulk wine.
      </p>
    </article>
  );
}
