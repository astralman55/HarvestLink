import Link from "next/link";
import { REGION_PAGES, VARIETY_PAGES, landingPath } from "@/content/landing";

/** A collapsed "browse by region or variety" strip for the marketplace pages. */
export function BrowseTopics() {
  const groups = [
    { title: "Regions", all: "/regions", pages: REGION_PAGES },
    { title: "Varieties", all: "/varieties", pages: VARIETY_PAGES },
  ];
  return (
    <details className="group mb-6 rounded-xl border border-stone-200 bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-stone-700 marker:hidden hover:text-[var(--color-brand)]">
        Browse by region or variety <span className="text-stone-400 group-open:hidden">▾</span>
        <span className="hidden text-stone-400 group-open:inline">▴</span>
      </summary>
      <div className="grid gap-4 border-t border-stone-100 px-4 py-4 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {group.title} ·{" "}
              <Link href={group.all} className="normal-case text-[var(--color-brand)] hover:underline">
                see all
              </Link>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={landingPath(page)}
                    className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
