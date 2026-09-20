"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { REGION_PAGES, VARIETY_PAGES, landingPath } from "@/content/landing";

/**
 * The one menu for everything that is not a marketplace section: guides (Blog,
 * FAQ) and every region and variety page. One button keeps the header short,
 * including on phones, and puts every page one tap away from any page.
 */
export function ExploreMenu({ className = "" }: { className?: string }) {
  const groups = [
    { title: "Regions", all: { href: "/regions", label: "All regions" }, pages: REGION_PAGES },
    { title: "Varieties", all: { href: "/varieties", label: "All varieties" }, pages: VARIETY_PAGES },
  ];
  const linkClass = "block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100";

  return (
    <Sheet>
      <SheetTrigger
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-stone-300 px-3.5 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 ${className}`}
      >
        <Compass className="size-4" /> Explore
      </SheetTrigger>
      <SheetContent side="right" className="gap-2 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Explore</SheetTitle>
        </SheetHeader>

        <nav aria-label="Learn" className="mt-3">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Learn</p>
          <ul className="mt-1 flex flex-col">
            <li>
              <SheetClose asChild>
                <Link href="/blog" className={linkClass}>
                  Blog and guides
                </Link>
              </SheetClose>
            </li>
            <li>
              <SheetClose asChild>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </SheetClose>
            </li>
          </ul>
        </nav>

        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title} className="mt-3">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{group.title}</p>
            <ul className="mt-1 flex flex-col">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <SheetClose asChild>
                    <Link href={landingPath(page)} className={linkClass}>
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
