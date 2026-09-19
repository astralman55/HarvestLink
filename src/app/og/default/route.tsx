import { renderOgCard } from "@/lib/og";

export const dynamic = "force-static";

/** Default social card for every page that doesn't have its own. */
export function GET() {
  return renderOgCard({ title: "Buy and sell wine grapes and bulk wine, direct.", kicker: "Confidential NDA listings available" });
}
