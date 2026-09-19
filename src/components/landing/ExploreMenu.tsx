"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { REGION_PAGES, VARIETY_PAGES, landingPath } from "@/content/landing";

/**
 * Header menu that lists every region and variety page, so a visitor on any page
 * (including phones, where the header has no room for a full nav) is one tap from
 * "Napa County" or "Pinot Noir".
 */
export function ExploreMenu({ className = "" }: { className?: string }) {
  const groups = [
    { title: "Regions", all: { href: "/regions", label: "All regions" }, pages: REGION_PAGES },
    { title: "Varieties", all: { href: "/varieties", label: "All varieties" }, pages: VARIETY_PAGES },
  ];

  return (
    <Sheet>
      <SheetTrigger
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-stone-300 px-3.5 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 ${className}`}
      >
        <Compass className="size-4" />
        <span className="md:hidden">Explore</span>
        <span className="hidden md:inline">Regions &amp; Varieties</span>
      </SheetTrigger>
      <SheetContent side="right" className="gap-2 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Browse by region or variety</SheetTitle>
        </SheetHeader>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title} className="mt-3">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{group.title}</p>
            <ul className="mt-1 flex flex-col">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <SheetClose asChild>
                    <Link href={landingPath(page)} className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
                      {page.name}
                    </Link>
                  </SheetClose>
                </li>
              ))}
              <li>
                <SheetClose asChild>
                  <Link href={group.all.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-brand)] hover:bg-stone-100">
                    {group.all.label} →
                  </Link>
                </SheetClose>
              </li>
            </ul>
          </nav>
        ))}
      </SheetContent>
    </Sheet>
  );
}
