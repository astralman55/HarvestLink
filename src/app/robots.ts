import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Private and non-content routes: dashboards, auth screens, alert settings,
 * API and confirmation endpoints. Everything else is public and crawlable.
 * (Pages under these also send a noindex robots meta, since robots.txt alone
 * does not remove a URL that other sites link to.)
 */
const DISALLOW = [
  "/api/",
  "/auth/",
  "/dashboard",
  "/listings/mine",
  "/listings/create",
  "/listings/*/edit",
  "/inquiries",
  "/requests",
  "/responses",
  "/wanted/new",
  "/wanted/unsubscribe",
  "/admin",
  "/choose-username",
  "/planning",
  "/alerts",
  "/security",
  "/sell/grapes",
  "/sell/bulk-wine",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

/**
 * Search and AI answer crawlers we explicitly welcome. Each named group must
 * repeat the disallow list, because a crawler that matches a specific group
 * ignores the "*" group entirely. Confidential (NDA) data never appears in
 * public HTML, so allowing AI systems in does not touch confidentiality.
 */
const WELCOMED_BOTS = [
  "Googlebot",
  "Bingbot",
  "ShapBot", // Parallel Web Systems (Parallel Search / Extract index)
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "DuckAssistBot",
  "Amazonbot",
  "CCBot",
  "YouBot",
  "cohere-ai",
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...WELCOMED_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
