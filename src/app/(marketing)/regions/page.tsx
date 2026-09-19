import type { Metadata } from "next";
import { LandingHub } from "@/components/landing/LandingHub";
import { REGION_PAGES } from "@/content/landing";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wine Grape Regions: Napa, Sonoma, Paso Robles & More",
  description: "Browse wine grapes and bulk wine by region, from Napa and Sonoma to Oregon, Washington and Long Island, with facts and live lots for each.",
  path: "/regions",
});

export default function RegionsPage() {
  return (
    <LandingHub
      title="Wine Grape Regions"
      intro="Ten regions with the most activity on HarvestLink. Each page has the facts a buyer or seller should know, what to check before agreeing on a lot, and the current grape and bulk wine listings."
      path="/regions"
      pages={REGION_PAGES}
    />
  );
}
