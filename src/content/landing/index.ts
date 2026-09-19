import { REGION_PAGES } from "./regions";
import { VARIETY_PAGES } from "./varieties";
import type { LandingPage } from "./types";

export type { LandingPage } from "./types";
export { REGION_PAGES, VARIETY_PAGES };

export const ALL_LANDING_PAGES: readonly LandingPage[] = [...REGION_PAGES, ...VARIETY_PAGES];

export function getLandingPage(kind: "region" | "variety", slug: string): LandingPage | undefined {
  return (kind === "region" ? REGION_PAGES : VARIETY_PAGES).find((page) => page.slug === slug);
}

/** The public path for a landing page. */
export function landingPath(page: Pick<LandingPage, "kind" | "slug">): string {
  return `${page.kind === "region" ? "/regions" : "/varieties"}/${page.slug}`;
}

/** Resolves an "also see" slug to a page in either group (slugs are unique across both). */
export function findLandingBySlug(slug: string): LandingPage | undefined {
  return ALL_LANDING_PAGES.find((page) => page.slug === slug);
}

/** The browse filter for a page: region pages filter on region_ava, variety pages on variety. */
export function landingFilter(page: LandingPage): { region_ava: string } | { variety: string } {
  return page.kind === "region" ? { region_ava: page.filterValue } : { variety: page.filterValue };
}
