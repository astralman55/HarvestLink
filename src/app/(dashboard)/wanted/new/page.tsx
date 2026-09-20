import { notFound, redirect } from "next/navigation";
import { RequestForm } from "@/components/wanted/RequestForm";
import { GRAPE_VARIETIES, REGION_NAMES } from "@/lib/constants/viticulture";
import { flags } from "@/lib/flags";
import { needsUsername } from "@/lib/supabase/needs-username";

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!flags.wanted) notFound();
  if (await needsUsername()) redirect(`/choose-username?redirect_to=${encodeURIComponent("/wanted/new")}`);

  // Filters from the page that sent the member here (an empty search, a region page) prefill the form.
  const params = await searchParams;
  const type = first(params.type) === "bulk_wine" && flags.bulkWine ? "bulk_wine" : "grapes";
  const variety = GRAPE_VARIETIES.includes(first(params.variety)) ? first(params.variety) : undefined;
  const region = REGION_NAMES.includes(first(params.region)) ? first(params.region) : undefined;
  const year = /^\d{4}$/.test(first(params.year)) ? first(params.year) : undefined;

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">Wanted</p>
      <h1 className="mt-1 text-2xl font-semibold text-stone-900">Post what you&apos;re looking for</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tell sellers what you need. Sellers with a matching lot are emailed, and anyone can offer a lot from the request page. Replies come to your inbox here, and you decide who you talk to.
      </p>
      <RequestForm initial={{ type, variety, region, year }} />
    </div>
  );
}
