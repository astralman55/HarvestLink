import Link from "next/link";
import { flags } from "@/lib/flags";
import { Wordmark } from "@/components/shared/Wordmark";

function getColumns() {
  return [
    {
      heading: "Marketplace",
      links: [
        { href: "/grapes", label: "Browse Grapes" },
        ...(flags.bulkWine ? [{ href: "/bulk-wine", label: "Browse Bulk Wine" }] : []),
        { href: "/sell", label: "List Your Harvest" },
        { href: "/planning", label: "Crop Planning" },
        { href: "/alerts", label: "Email Alerts" },
      ],
    },
    {
      heading: "Learn",
      links: [
        { href: "/blog", label: "Blog" },
        { href: "/faq", label: "FAQ" },
        { href: "/blog/what-is-bulk-wine", label: "What Is Bulk Wine?" },
        { href: "/blog/how-to-buy-bulk-wine", label: "How to Buy Bulk Wine" },
        { href: "/blog/how-to-buy-wine-grapes", label: "How to Buy Wine Grapes" },
      ],
    },
    {
      heading: "Browse",
      links: [
        { href: "/grapes?farming_practice=organic", label: "Organic Fruit" },
        { href: "/grapes?farming_practice=biodynamic", label: "Biodynamic Fruit" },
        { href: "/regions", label: "Wine Grape Regions" },
        { href: "/varieties", label: "Wine Grape Varieties" },
        { href: "/regions/napa-county", label: "Napa County" },
        { href: "/varieties/cabernet-sauvignon", label: "Cabernet Sauvignon" },
        { href: "/login", label: "Log In" },
        { href: "/register", label: "Create an Account" },
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
            <Link href="/" className="inline-flex items-center" aria-label="bulkwinegrapes.com home">
              <Wordmark className="h-8 w-auto" />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-stone-500">
              bulkwinegrapes.com (BWG) is an online marketplace where wine grape growers, wineries, and wine brands buy and sell
              wine grapes and bulk wine directly, including confidential listings under NDA.
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
        <div className="mt-12 flex flex-col gap-3 border-t border-stone-200 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} bulkwinegrapes.com. Buyers and sellers arrange terms, payment and delivery directly.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-stone-900">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-stone-900">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
