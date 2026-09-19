import { getAllPosts } from "@/lib/blog";
import { CANONICAL_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";

/**
 * /llms.txt: a short, curated map of the site for AI systems (llmstxt.org
 * format). It lists only public, indexable pages; confidential listings are
 * never named here.
 */
export function GET() {
  const posts = getAllPosts();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${CANONICAL_DESCRIPTION}`,
    "",
    "HarvestLink lists wine grapes priced per ton and bulk wine priced per gallon. Buyers and sellers arrange price, payment and delivery directly; HarvestLink does not charge fees, process payments or ship product. Sellers can hide their identity under NDA.",
    "",
    "## Marketplaces",
    "",
    `- [Wine grapes for sale](${absoluteUrl("/grapes")}): grape lots by variety, region, harvest year, farming practice, tonnage and price per ton`,
    `- [Bulk wine for sale](${absoluteUrl("/bulk-wine")}): bulk wine lots by varietal, vintage, ABV, sulfites, region and price per gallon`,
    `- [Sell grapes or bulk wine](${absoluteUrl("/sell")}): how sellers list, openly or under NDA`,
    "",
    "## Answers",
    "",
    `- [FAQ](${absoluteUrl("/faq")}): how HarvestLink works, NDA listings, pricing, payment, alerts`,
    `- [Blog index](${absoluteUrl("/blog")}): all guides`,
    "",
    "## Guides",
    "",
    ...posts.map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.description}`),
    "",
    "## Optional",
    "",
    `- [Full text of the FAQ and every guide, in Markdown](${absoluteUrl("/llms-full.txt")})`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
    `- [Terms of Service](${absoluteUrl("/terms")})`,
    `- [Privacy Policy](${absoluteUrl("/privacy")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
