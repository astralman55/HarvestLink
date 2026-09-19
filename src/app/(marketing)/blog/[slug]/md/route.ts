import { getAllPosts, getPost } from "@/lib/blog";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/**
 * Clean Markdown copy of a post, served at /blog/{slug}.md (see the rewrite in
 * next.config.ts). AI agents and search systems that extract page text can
 * take the article without navigation or scripts.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });

  const body = [
    `# ${post.title}`,
    "",
    `Author: ${post.author} | Published: ${post.datePublished} | Last updated: ${post.dateModified} | ${SITE_NAME}`,
    `Canonical URL: ${absoluteUrl(`/blog/${post.slug}`)}`,
    "",
    `> **Quick answer:** ${post.quickAnswer}`,
    "",
    post.markdown,
    "",
    "## Frequently asked questions",
    "",
    ...post.faq.flatMap((item) => [`### ${item.q}`, "", item.a, ""]),
    ...(post.sources.length > 0
      ? ["## Sources", "", ...post.sources.map((source) => `- [${source.title}](${source.url}) (accessed ${source.accessed})`), ""]
      : []),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      // Keep the canonical HTML page as the one that ranks; the .md copy is for machines.
      Link: `<${absoluteUrl(`/blog/${post.slug}`)}>; rel="canonical"`,
    },
  });
}
