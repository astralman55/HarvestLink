import type { Metadata } from "next";
import { LandingHub } from "@/components/landing/LandingHub";
import { VARIETY_PAGES } from "@/content/landing";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wine Grape Varieties: Cabernet, Chardonnay, Pinot & More",
  description: "Browse wine grapes and bulk wine by variety, from Cabernet Sauvignon and Chardonnay to Zinfandel and Riesling, with buying notes and live lots.",
  path: "/varieties",
});

export default function VarietiesPage() {
  return (
    <LandingHub
      title="Wine Grape Varieties"
      intro="Ten varieties buyers and growers ask about most. Each page explains what makes the variety different, what to check on a lot, and shows the current grape and bulk wine listings."
      path="/varieties"
      pages={VARIETY_PAGES}
    />
  );
}
