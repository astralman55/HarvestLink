"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/flags";
import { Wordmark } from "@/components/shared/Wordmark";
import { ExploreMenu } from "@/components/landing/ExploreMenu";

// WINE-3: persistent header switch between the marketplace sections, so none
// ever gets confused with another. Grapes is always there; Bulk Wine and Wanted
// join as segments of the same control when their flags are on, which keeps the
// header to one switch instead of a row of separate links. Everything else
// (Regions, Varieties, Blog, FAQ) lives in the single Explore menu.
//
// Grapes and Bulk Wine link to "/" (this project's one homepage), not
// straight to the results grid -- the switch's job is "take me to that
// section's homepage," matching GrapeSearchHero's own entry point. The
// homepage itself reads ?market=bulk-wine to decide which hero copy and
// search form to show. Wanted has its own page.
//
// The active-state piece is split into its own component and wrapped in
// Suspense because it needs useSearchParams(), which otherwise forces this
// entire layout -- and every otherwise-static page under it, like /login
// and /register -- out of static rendering (Next.js's own requirement).
type Section = "grapes" | "bulk-wine" | "wanted";

function SwitchSegments({ active }: { active: Section | null }) {
  const segments: { key: Section; label: string; href: string }[] = [
    { key: "grapes", label: "Grapes", href: "/" },
    ...(flags.bulkWine ? [{ key: "bulk-wine" as const, label: "Bulk Wine", href: "/?market=bulk-wine" }] : []),
    ...(flags.wanted ? [{ key: "wanted" as const, label: "Wanted", href: "/wanted" }] : []),
  ];

  return (
    <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
      {segments.map((segment) => (
        <Link
          key={segment.key}
          href={segment.href}
          aria-current={active === segment.key ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3.5 ${
            active === segment.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          {segment.label}
        </Link>
      ))}
    </div>
  );
}

function ActiveSwitch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active: Section = pathname.startsWith("/wanted")
    ? "wanted"
    : pathname.startsWith("/bulk-wine") || (pathname === "/" && searchParams.get("market") === "bulk-wine")
      ? "bulk-wine"
      : "grapes";
  return <SwitchSegments active={active} />;
}

function MarketplaceSwitch() {
  if (!flags.bulkWine && !flags.wanted) {
    return (
      <Link href="/grapes" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
        Browse Grapes
      </Link>
    );
  }

  return (
    <Suspense fallback={<SwitchSegments active="grapes" />}>
      <ActiveSwitch />
    </Suspense>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="bulkwinegrapes.com home">
          <Wordmark className="h-[22px] w-auto sm:h-8" />
        </Link>

        <nav className="hidden items-center gap-4 md:flex" aria-label="Main">
          <MarketplaceSwitch />
          <ExploreMenu />
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sell">Sell</Link>
          </Button>
        </div>
      </div>

      {/* On phones the logo, Log in, and Sell already fill the top row, so the
          marketplace switch gets its own row underneath, with the Explore menu
          beside it (it used to be hidden below the md breakpoint). */}
      <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-4 py-2 md:hidden">
        <MarketplaceSwitch />
        <ExploreMenu />
      </div>
    </header>
  );
}
