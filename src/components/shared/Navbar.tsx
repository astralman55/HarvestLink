"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/flags";
import { Wordmark } from "@/components/shared/Wordmark";

// WINE-3: persistent header switch between the two sections, so neither
// ever gets confused with the other. Skips the segmented control entirely
// while the flag is off -- grapes is the only section that exists then.
//
// Both options link to "/" (this project's one homepage), not
// straight to the results grid -- the switch's job is "take me to that
// section's homepage," matching GrapeSearchHero's own entry point. The
// homepage itself reads ?market=bulk-wine to decide which hero copy and
// search form to show; from anywhere already inside a section (browsing
// /bulk-wine, a listing, etc.) the switch still shows that section active.
//
// The active-state piece is split into its own component and wrapped in
// Suspense because it needs useSearchParams(), which otherwise forces this
// entire layout -- and every otherwise-static page under it, like /login
// and /register -- out of static rendering (Next.js's own requirement).
function BulkWineToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBulkWine = pathname.startsWith("/bulk-wine") || (pathname === "/" && searchParams.get("market") === "bulk-wine");

  return (
    <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
      <Link
        href="/"
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          !isBulkWine ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
        }`}
      >
        Grapes
      </Link>
      <Link
        href="/?market=bulk-wine"
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          isBulkWine ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
        }`}
      >
        Bulk Wine
      </Link>
    </div>
  );
}

function MarketplaceSwitch() {
  if (!flags.bulkWine) {
    return (
      <Link href="/grapes" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
        Browse Grapes
      </Link>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
          <span className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-stone-900 shadow-sm">Grapes</span>
          <span className="px-3.5 py-1.5 text-sm font-medium text-stone-500">Bulk Wine</span>
        </div>
      }
    >
      <BulkWineToggle />
    </Suspense>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="HarvestLink home">
          <Wordmark className="h-7 w-auto sm:h-8" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <MarketplaceSwitch />
          <Link href="/blog" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
            Blog
          </Link>
          <Link href="/faq" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
            FAQ
          </Link>
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
          Grapes / Bulk Wine switch gets its own row underneath instead of
          disappearing (it used to be hidden below the md breakpoint). */}
      <div className="flex justify-center border-t border-stone-100 px-4 py-2 md:hidden">
        <MarketplaceSwitch />
      </div>
    </header>
  );
}
