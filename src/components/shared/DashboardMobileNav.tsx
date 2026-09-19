"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { Wordmark } from "@/components/shared/Wordmark";
import { DASHBOARD_NAV, siteLinks } from "@/components/shared/dashboard-nav";

interface DashboardMobileNavProps {
  name: string;
  subtitle: string;
}

/**
 * The member area's navigation on phones and tablets, where the desktop
 * sidebar is hidden: a sticky top bar with the logo (a way back to the home
 * page) and a menu that lists every member page, the public site, and sign out.
 */
export function DashboardMobileNav({ name, subtitle }: DashboardMobileNavProps) {
  const site = siteLinks();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur md:hidden">
      <Link href="/" className="flex items-center" aria-label="HarvestLink home">
        <Wordmark className="h-6 w-auto" />
      </Link>

      <Sheet>
        <SheetTrigger className="flex items-center gap-2 rounded-full border border-stone-300 px-3.5 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
          <Menu className="size-4" /> Menu
        </SheetTrigger>
        <SheetContent side="right" className="gap-2">
          <SheetHeader>
            <SheetTitle>{name}</SheetTitle>
            <p className="text-xs capitalize text-stone-500">{subtitle}</p>
          </SheetHeader>

          <nav aria-label="Your account" className="mt-4 flex flex-col gap-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Your account</p>
            {DASHBOARD_NAV.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link href={item.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">
                  {item.icon && <item.icon className="size-4" />}
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <nav aria-label="HarvestLink" className="mt-4 flex flex-col gap-1 border-t border-stone-100 pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-500">HarvestLink</p>
            {site.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div className="mt-auto border-t border-stone-100 pt-3">
            <SignOutButton />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
