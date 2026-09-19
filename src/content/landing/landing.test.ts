import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ALL_LANDING_PAGES, REGION_PAGES, VARIETY_PAGES, landingFilter } from "@/content/landing";
import { getAllPosts } from "@/lib/blog";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seo";
import { FEATURED_REGIONS, GRAPE_VARIETIES, REGION_NAMES } from "@/lib/constants/viticulture";

/**
 * Quality gates for the region and variety pages, run in CI: unique copy,
 * correctly sized metadata, real images, working internal links, and values that
 * match what the browse filters actually store.
 */
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
const postSlugs = new Set(getAllPosts().map((post) => post.slug));
const allSlugs = new Set(ALL_LANDING_PAGES.map((page) => page.slug));
const textOf = (page: (typeof ALL_LANDING_PAGES)[number]) =>
  [page.h1, page.metaTitle, page.description, page.quickAnswer, ...page.intro, ...page.facts.flatMap((f) => [f.label, f.value]), ...page.buyerNotes, ...page.faq.flatMap((f) => [f.q, f.a]), page.imageAlt].join("\n");

describe("landing pages", () => {
  it("has ten regions and ten varieties with unique slugs, titles and descriptions", () => {
    expect(REGION_PAGES).toHaveLength(10);
    expect(VARIETY_PAGES).toHaveLength(10);
    for (const key of ["slug", "metaTitle", "description", "h1", "quickAnswer", "image"] as const) {
      expect(new Set(ALL_LANDING_PAGES.map((page) => page[key])).size, key).toBe(ALL_LANDING_PAGES.length);
    }
  });

  it("covers exactly the regions featured on the homepage", () => {
    expect(REGION_PAGES.map((page) => page.filterValue)).toEqual([...FEATURED_REGIONS]);
  });

  it("has no copy shared between pages (no template boilerplate)", () => {
    const seen = new Map<string, string>();
    for (const page of ALL_LANDING_PAGES) {
      for (const paragraph of [...page.intro, ...page.buyerNotes, ...page.faq.map((f) => f.a)]) {
        const other = seen.get(paragraph);
        expect(other, `"${paragraph.slice(0, 50)}" repeated on ${page.slug} and ${other}`).toBeUndefined();
        seen.set(paragraph, page.slug);
      }
    }
  });

  it.each(ALL_LANDING_PAGES.map((page) => [page.slug, page] as const))("%s: metadata, copy and links", (_slug, page) => {
    expect(page.metaTitle.length, "metaTitle length").toBeLessThanOrEqual(TITLE_MAX);
    expect(page.description.length, "description length").toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(page.description.length, "description length").toBeGreaterThanOrEqual(80);
    expect(words(page.quickAnswer), "quick answer words").toBeGreaterThanOrEqual(35);
    expect(words(page.quickAnswer), "quick answer words").toBeLessThanOrEqual(70);
    expect(words(page.intro.join(" ")), "intro words").toBeGreaterThanOrEqual(100);
    expect(words(textOf(page)), "written words on the page").toBeGreaterThanOrEqual(380);
    expect(page.intro.length).toBeGreaterThanOrEqual(2);
    expect(page.facts.length).toBeGreaterThanOrEqual(4);
    expect(page.buyerNotes.length).toBeGreaterThanOrEqual(3);
    expect(page.faq.length).toBeGreaterThanOrEqual(3);
    expect(page.sources.length).toBeGreaterThanOrEqual(1);
    for (const source of page.sources) expect(source.url).toMatch(/^https:\/\//);

    expect(page.related).toHaveLength(3);
    for (const slug of page.related) expect(postSlugs.has(slug), `related post ${slug}`).toBe(true);
    expect(page.alsoSee.length).toBeGreaterThanOrEqual(3);
    for (const slug of page.alsoSee) {
      expect(allSlugs.has(slug), `alsoSee ${slug}`).toBe(true);
      expect(slug).not.toBe(page.slug);
    }
  });

  it.each(ALL_LANDING_PAGES.map((page) => [page.slug, page] as const))("%s: house style", (_slug, page) => {
    const text = textOf(page);
    expect(text, "em dash").not.toMatch(/—/);
    expect(text, "en dash").not.toMatch(/–/);
    expect(text, "placeholder").not.toMatch(/TODO|TBD|lorem|\{\{/i);
    expect(text, "money handling claim").not.toMatch(/escrow|we (collect|process|handle) payments?/i);
    expect(page.imageAlt.length).toBeGreaterThan(20);
  });

  it.each(ALL_LANDING_PAGES.map((page) => [page.slug, page] as const))("%s: images exist and stay small", (_slug, page) => {
    const full = path.join(process.cwd(), "public", page.image);
    const thumb = full.replace(".webp", "-thumb.webp");
    expect(fs.existsSync(full), full).toBe(true);
    expect(fs.existsSync(thumb), thumb).toBe(true);
    expect(fs.statSync(full).size).toBeLessThanOrEqual(150 * 1024);
    expect(page.image).toBe(`/images/landing/${page.slug}.webp`);
  });

  it("filters on values the browse filters actually store", () => {
    for (const page of REGION_PAGES) {
      expect(REGION_NAMES).toContain(page.filterValue);
      expect(landingFilter(page)).toEqual({ region_ava: page.filterValue });
    }
    for (const page of VARIETY_PAGES) {
      expect(GRAPE_VARIETIES).toContain(page.filterValue);
      expect(landingFilter(page)).toEqual({ variety: page.filterValue });
    }
  });
});
