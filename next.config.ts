import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Blog posts are read from /content/blog at runtime by the RSS, sitemap,
  // llms.txt and Markdown routes; make sure Vercel ships them with the functions.
  outputFileTracingIncludes: {
    "/**": ["./content/blog/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // WINE-2: old listing URLs must keep working via 301s to the new
  // canonical grapes URLs. These two are static (no DB lookup needed);
  // /listings/[id] is dynamic (its target depends on listing_type) and is
  // handled at request time in that route instead -- see
  // docs/scope-addendum-decisions.md.
  // /blog/{slug}.md is a clean Markdown copy of each post for AI agents.
  async rewrites() {
    return [{ source: "/blog/:slug([a-z0-9-]+).md", destination: "/blog/:slug/md" }];
  },
  async redirects() {
    return [
      { source: "/listings", destination: "/grapes", permanent: true },
      { source: "/listings/create", destination: "/sell/grapes", permanent: true },
    ];
  },
};

export default nextConfig;
