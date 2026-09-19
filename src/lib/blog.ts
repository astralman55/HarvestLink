import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { z } from "zod";

/**
 * File-based blog: every post is a Markdown file in /content/blog with YAML
 * front matter (validated below), rendered to HTML on the server. Content
 * lives in the repo so it is versioned and reviewable; there is no CMS and no
 * database involved. A post with `status: draft` is invisible everywhere
 * (index, sitemap, RSS, llms.txt, direct URL).
 */
const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export const WIDGET_MARKER_PREFIX = "<!--widget:";

const FrontMatterSchema = z.object({
  title: z.string().min(10).max(110),
  /** The <title> tag, 60 characters or fewer. */
  metaTitle: z.string().min(10).max(60),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  description: z.string().min(80).max(155),
  primaryKeyword: z.string().min(3),
  secondaryKeywords: z.array(z.string()).default([]),
  category: z.enum(["Wine Basics", "Buying Bulk Wine", "Wine Grapes", "Farming and Regions", "Selling"]),
  datePublished: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateModified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  author: z.string().default("Andrew L."),
  status: z.enum(["published", "draft"]).default("published"),
  /** 40-60 word direct answer shown at the top of the post (also quoted by AI answers). */
  quickAnswer: z.string().min(120).max(520),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).min(3).max(5),
  sources: z.array(z.object({ title: z.string(), url: z.string().url(), accessed: z.string() })).default([]),
  related: z.array(z.string()).default([]),
  cta: z.enum(["bulk-wine", "grapes", "sell"]).default("bulk-wine"),
  /** Self-hosted photo in /public/images/blog (a "-thumb" twin sits next to it for cards). See docs/image-credits.md. */
  heroImage: z.string().regex(/^\/images\/blog\/[a-z0-9-]+\.webp$/),
  /** What is visible in the photo, in plain words (screen readers and image search). */
  heroAlt: z.string().min(20).max(160),
});

export type BlogFrontMatter = z.infer<typeof FrontMatterSchema>;

/** The small card version of a post's photo. */
export function thumbFor(post: { heroImage: string }): string {
  return post.heroImage.replace(/\.webp$/, "-thumb.webp");
}

export interface BlogPost extends BlogFrontMatter {
  /** Rendered body HTML, split at any `<!--widget:name-->` markers (usually one part). */
  htmlParts: string[];
  widgets: string[];
  toc: { id: string; text: string }[];
  wordCount: number;
  readingMinutes: number;
  /** The Markdown body exactly as written (served as /blog/{slug}.md for AI agents). */
  markdown: string;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderMarkdown(body: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const used = new Set<string>();

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const plain = inner.replace(/<[^>]+>/g, "");
        let id = slugifyHeading(plain) || "section";
        while (used.has(id)) id = `${id}-2`;
        used.add(id);
        if (depth === 2) toc.push({ id, text: plain });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const attrs = `${title ? ` title="${title}"` : ""}${external ? ' rel="noopener" target="_blank"' : ""}`;
        return `<a href="${href}"${attrs}>${text}</a>`;
      },
    },
  });

  const html = (marked.parse(body, { async: false }) as string)
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return { html, toc };
}

function parsePost(file: string): BlogPost {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const parsed = FrontMatterSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Invalid front matter in content/blog/${file}: ${issue?.path.join(".")} ${issue?.message}`);
  }
  const fm = parsed.data;
  const { html, toc } = renderMarkdown(content);

  const htmlParts: string[] = [];
  const widgets: string[] = [];
  const pattern = /<!--widget:([a-z0-9-]+)-->/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    htmlParts.push(html.slice(last, match.index));
    widgets.push(match[1]);
    last = match.index + match[0].length;
  }
  htmlParts.push(html.slice(last));

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return {
    ...fm,
    htmlParts,
    widgets,
    toc,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 220)),
    markdown: content.trim(),
  };
}

let cache: BlogPost[] | null = null;

/** All published posts, newest first. Drafts never leave this module. */
export function getAllPosts(): BlogPost[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const posts = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(parsePost)
    .filter((post) => post.status === "published")
    .sort((a, b) => (a.datePublished === b.datePublished ? a.title.localeCompare(b.title) : b.datePublished.localeCompare(a.datePublished)));
  cache = posts;
  return posts;
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Related posts: the ones listed in front matter, topped up with the same category. */
export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const all = getAllPosts();
  const picked = post.related.map((slug) => all.find((p) => p.slug === slug)).filter((p): p is BlogPost => !!p);
  for (const candidate of all) {
    if (picked.length >= limit) break;
    if (candidate.slug !== post.slug && candidate.category === post.category && !picked.includes(candidate)) picked.push(candidate);
  }
  for (const candidate of all) {
    if (picked.length >= limit) break;
    if (candidate.slug !== post.slug && !picked.includes(candidate)) picked.push(candidate);
  }
  return picked.slice(0, limit);
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
