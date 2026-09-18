"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grape } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/flags";

const NAV_LINKS = [{ href: "/planning", label: "Crop Planning" }];

// WINE-3: persistent header switch between the two sections, so neither
// ever gets confused with the other. Skips the segmented control entirely
// while the flag is off -- grapes is the only section that exists then.
function MarketplaceSwitch() {
  const pathname = usePathname();

  if (!flags.bulkWine) {
    return (
      <Link href="/grapes" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
        Browse Grapes
      </Link>
    );
  }

  const isBulkWine = pathname.startsWith("/bulk-wine");
  return (
    <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
      <Link
        href="/grapes"
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          !isBulkWine ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
        }`}
      >
        Grapes
      </Link>
      <Link
        href="/bulk-wine"
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          isBulkWine ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"
        }`}
      >
        Bulk Wine
      </Link>
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-stone-900">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
            <Grape className="size-4.5" />
          </span>
          <span className="text-lg tracking-tight">HarvestLink</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <MarketplaceSwitch />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sell">Sell</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
