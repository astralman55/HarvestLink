import { getAllPosts, getPost } from "@/lib/blog";
import { renderOgCard } from "@/lib/og";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** Social card for a blog post: its title and category on the brand background. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return renderOgCard({ title: post.title, kicker: post.category });
}
