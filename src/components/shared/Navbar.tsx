import Link from "next/link";
import { Grape } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/listings", label: "Browse Grapes" },
  { href: "/planning", label: "Crop Planning" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
            <Grape className="size-4.5" />
          </span>
          <span className="text-lg tracking-tight">HarvestLink</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
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
            <Link href="/register">Sell Your Harvest</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
