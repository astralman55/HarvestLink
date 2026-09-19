import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CANONICAL_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Makes relative canonical / Open Graph URLs resolve against the real domain.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wine Grapes & Bulk Wine Marketplace | bulkwinegrapes.com",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Buy and sell wine grapes and bulk wine direct. Search by variety, region, vintage and price per ton or gallon. Confidential NDA listings available.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    description: CANONICAL_DESCRIPTION,
    images: [{ url: `${SITE_URL}/og/default`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", images: [`${SITE_URL}/og/default`] },
  alternates: { types: { "application/rss+xml": `${SITE_URL}/blog/rss.xml` } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
