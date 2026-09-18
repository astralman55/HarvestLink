import Link from "next/link";
import { Grape } from "lucide-react";
import { flags } from "@/lib/flags";

function getColumns() {
  return [
    {
      heading: "Marketplace",
      links: [
        { href: "/grapes", label: "Browse Grapes" },
        ...(flags.bulkWine ? [{ href: "/bulk-wine", label: "Browse Bulk Wine" }] : []),
        { href: "/sell", label: "List Your Harvest" },
        { href: "/planning", label: "Crop Planning" },
      ],
    },
    {
      heading: "Company",
      links: [
        { href: "/login", label: "Log In" },
        { href: "/register", label: "Create an Account" },
      ],
    },
    {
      heading: "Resources",
      links: [
        { href: "/grapes?farming_practice=organic", label: "Organic Fruit" },
        { href: "/grapes?farming_practice=biodynamic", label: "Biodynamic Fruit" },
        { href: "/grapes?region_ava=Napa+Valley", label: "Napa Valley Listings" },
      ],
    },
  ];
}

export function Footer() {
  const columns = getColumns();
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
              <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
                <Grape className="size-4.5" />
              </span>
              <span className="text-lg tracking-tight">HarvestLink</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-stone-500">
              The B2B marketplace connecting growers and buyers for grape lots and multi-year
              forward contracts.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {col.heading}
              </h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-600 hover:text-stone-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-stone-200 pt-6 text-xs text-stone-500">
          © {new Date().getFullYear()} HarvestLink. Built for growers and buyers who plan ahead.
        </div>
      </div>
    </footer>
  );
}
