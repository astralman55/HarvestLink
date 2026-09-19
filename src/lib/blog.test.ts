import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "@/lib/blog";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seo";
import { FAQ_ITEMS } from "@/content/faq";

/**
 * Quality gates for /content/blog, run in CI so a bad post can't ship:
 * unique, correctly sized metadata, working internal links, real related
 * posts, and the house style (no em dashes, no unfilled placeholders).
 */
const posts = getAllPosts();
const slugs = new Set(posts.map((post) => post.slug));
const STATIC_PATHS = new Set(["/", "/grapes", "/bulk-wine", "/sell", "/faq", "/blog", "/alerts", "/terms", "/privacy", "/login", "/register"]);
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe("blog posts", () => {
  it("has the full set of 15 published posts", () => {
    expect(posts).toHaveLength(15);
  });

  it("has unique slugs, titles, meta titles and descriptions", () => {
    for (const key of ["slug", "title", "metaTitle", "description"] as const) {
      expect(new Set(posts.map((post) => post[key])).size, key).toBe(posts.length);
    }
  });

  it.each(posts.map((post) => [post.slug, post] as const))("%s: metadata, structure and style", (_slug, post) => {
    expect(post.metaTitle.length, "metaTitle length").toBeLessThanOrEqual(TITLE_MAX);
    expect(post.description.length, "description length").toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(post.author).toBe("Andrew L.");
    expect(words(post.quickAnswer), "quick answer word count").toBeGreaterThanOrEqual(35);
    expect(words(post.quickAnswer), "quick answer word count").toBeLessThanOrEqual(70);
    expect(post.wordCount, "body length").toBeGreaterThanOrEqual(600);
    expect(post.toc.length, "has section headings").toBeGreaterThanOrEqual(4);
    expect(post.faq.length).toBeGreaterThanOrEqual(3);
    expect(post.faq.length).toBeLessThanOrEqual(5);
    expect(post.related.length).toBeGreaterThanOrEqual(3);
    for (const related of post.related) expect(slugs.has(related), `related post ${related} exists`).toBe(true);
    expect(post.related).not.toContain(post.slug);

    // House style: no em dashes anywhere the reader sees, and no unresolved placeholders.
    const everything = [post.title, post.description, post.quickAnswer, post.markdown, ...post.faq.flatMap((f) => [f.q, f.a])].join("\n");
    expect(everything.includes("—"), "em dash").toBe(false);
    expect(/\{\{|\bTODO\b|\bTBD\b|\bCONFIRM\b|lorem ipsum/.test(everything), "placeholder text").toBe(false);
  });

  it.each(posts.map((post) => [post.slug, post] as const))("%s: internal links resolve and marketplace links exist", (_slug, post) => {
    const links = [...post.markdown.matchAll(/\]\((\/[^)\s#]*)/g)].map((match) => match[1].split("?")[0]);
    const internal = links.filter((link) => link.startsWith("/"));
    expect(internal.length, "internal link count").toBeGreaterThanOrEqual(4);
    for (const link of internal) {
      const ok = STATIC_PATHS.has(link) || (link.startsWith("/blog/") && slugs.has(link.slice("/blog/".length)));
      expect(ok, `broken internal link ${link}`).toBe(true);
    }
    expect(internal.some((link) => link === "/grapes" || link === "/bulk-wine" || link === "/sell"), "links to a marketplace page").toBe(true);
  });

  it("only uses widget markers that exist", () => {
    for (const post of posts) for (const widget of post.widgets) expect(["gallons-calculator"]).toContain(widget);
  });

  it("has sources for every claim-heavy post", () => {
    const mustHaveSources = ["sulfites-in-wine", "how-much-alcohol-is-in-wine", "what-is-terroir", "why-napa-valley-wine-is-special", "organic-biodynamic-sustainable-wine-labels", "gallons-of-wine-per-ton-of-grapes"];
    for (const slug of mustHaveSources) expect(posts.find((post) => post.slug === slug)?.sources.length, slug).toBeGreaterThan(0);
  });
});

describe("FAQ content", () => {
  it("has plain-text answers with no em dashes", () => {
    for (const item of FAQ_ITEMS) {
      expect(item.a.includes("—")).toBe(false);
      expect(item.a.length).toBeGreaterThan(40);
    }
    expect(new Set(FAQ_ITEMS.map((item) => item.q)).size).toBe(FAQ_ITEMS.length);
  });
});

describe("repository content hygiene", () => {
  it("keeps every blog file's front matter valid (a broken file would throw at load time)", () => {
    const files = fs.readdirSync(path.join(process.cwd(), "content", "blog")).filter((file) => file.endsWith(".md"));
    expect(files.length).toBe(15);
  });
});
