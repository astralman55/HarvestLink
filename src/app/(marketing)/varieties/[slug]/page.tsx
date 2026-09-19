import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LandingView } from "@/components/landing/LandingView";
import { getLandingPage, landingPath } from "@/content/landing";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

// Live lots and the viewer's login state are per request, so this page is never prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingPage("variety", slug);
  if (!page) return {};
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    path: landingPath(page),
    image: absoluteUrl(page.image),
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getLandingPage("variety", slug);
  if (!page) notFound();
  return <LandingView page={page} />;
}
