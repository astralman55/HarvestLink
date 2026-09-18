import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Dashboard/account/admin surfaces are auth-gated anyway, but
        // keeping crawlers out of them too avoids indexing thin/duplicate
        // pages and login walls.
        disallow: ["/dashboard", "/listings/mine", "/listings/create", "/inquiries", "/admin", "/choose-username"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
