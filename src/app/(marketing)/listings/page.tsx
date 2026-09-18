import { redirect } from "next/navigation";

// WINE-2: /listings is now /grapes (grapes was the only section that ever
// existed at this URL, so it's the canonical target for old links).
// Query params (filters) carry over unchanged.
export default async function LegacyListingsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
  }
  redirect(`/grapes${query.toString() ? `?${query.toString()}` : ""}`);
}
