export interface LandingFact {
  label: string;
  value: string;
}

export interface LandingSource {
  title: string;
  url: string;
}

/**
 * One region or variety hub page (/regions/{slug}, /varieties/{slug}). Every
 * field is written per page: no template-swapped boilerplate, because thin,
 * near-duplicate pages do worse in search than no page at all. Facts come from
 * appellation bodies, grower commissions and reference sources listed in
 * `sources`; see docs/seo/blog-fact-check-log.md.
 */
export interface LandingPage {
  kind: "region" | "variety";
  slug: string;
  /** Display name: "Napa County" or "Cabernet Sauvignon". */
  name: string;
  /** Exact value the browse filter matches (region_ava for regions, variety for varieties). */
  filterValue: string;
  h1: string;
  /** <title>, 60 characters or fewer. */
  metaTitle: string;
  /** Meta description, 155 characters or fewer. */
  description: string;
  /** 35 to 70 words, shown first and quoted by AI answers. */
  quickAnswer: string;
  /** Two or three paragraphs of original copy. */
  intro: string[];
  facts: LandingFact[];
  /** What a buyer should check or compare, specific to this page. */
  buyerNotes: string[];
  faq: { q: string; a: string }[];
  sources: LandingSource[];
  /** Blog post slugs (3). */
  related: string[];
  /** Other landing slugs to link to (regions and varieties), 3 to 4. */
  alsoSee: string[];
  /** Photo under /public/images/landing (a "-thumb" twin sits next to it). */
  image: string;
  imageAlt: string;
}
