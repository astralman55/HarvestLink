import { getAllPosts } from "@/lib/blog";
import { FAQ_ITEMS } from "@/content/faq";
import { CANONICAL_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";

/** /llms-full.txt: the FAQ and every published guide in one Markdown document. */
export function GET() {
  const posts = getAllPosts();
  const parts = [
    `# ${SITE_NAME}`,
    "",
    `> ${CANONICAL_DESCRIPTION}`,
    "",
    `Site: ${absoluteUrl("/")}`,
    "",
    "# Frequently asked questions",
    "",
    ...FAQ_ITEMS.flatMap((item) => [`## ${item.q}`, "", item.a, ""]),
    ...posts.flatMap((post) => [
      "---",
      "",
      `# ${post.title}`,
      "",
      `URL: ${absoluteUrl(`/blog/${post.slug}`)} | Author: ${post.author} | Published: ${post.datePublished} | Updated: ${post.dateModified}`,
      "",
      `> Quick answer: ${post.quickAnswer}`,
      "",
      post.markdown,
      "",
      ...post.faq.flatMap((item) => [`## ${item.q}`, "", item.a, ""]),
    ]),
  ];
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
