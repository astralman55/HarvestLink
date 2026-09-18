"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Search, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PrimaryFilterFields,
  AdvancedFilterFields,
  type FilterValues,
  type FilterPatch,
} from "@/components/marketplace/ViticultureFilterFields";

const QUICK_FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: "Organic Cabernet", params: { variety: "Cabernet Sauvignon", farming_practice: "organic" } },
  { label: "Napa Valley", params: { region_ava: "Napa Valley" } },
  { label: "Biodynamic Pinot Noir", params: { variety: "Pinot Noir", farming_practice: "biodynamic" } },
  { label: "Forward Contracts", params: { harvest_year: String(new Date().getFullYear() + 2) } },
];

export function GrapeSearchHero() {
  const router = useRouter();
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [values, setValues] = useState<FilterValues>({});

  function patch(update: FilterPatch) {
    setValues((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(update)) {
        if (value === undefined || value === "") {
          delete next[key as keyof FilterValues];
        } else {
          next[key as keyof FilterValues] = value;
        }
      }
      return next;
    });
  }

  function runSearch(overrideParams?: Record<string, string>) {
    const params = new URLSearchParams();
    const source = overrideParams ?? values;
    for (const [key, value] of Object.entries(source)) {
      if (value) params.set(key, String(value));
    }
    router.push(`/grapes${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PrimaryFilterFields values={values} onChange={patch} />
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--color-brand)]"
      >
        <SlidersHorizontal className="size-4" />
        Farming practice, trellis, soil, exposure &amp; more
        <ChevronUp className={`size-4 transition-transform ${advancedOpen ? "" : "rotate-180"}`} />
      </button>

      {advancedOpen && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <AdvancedFilterFields values={values} onChange={patch} />
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.label}
              type="button"
              onClick={() => runSearch(qf.params)}
              className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {qf.label}
            </button>
          ))}
        </div>
        <Button size="lg" onClick={() => runSearch()} className="shrink-0">
          <Search className="size-4" />
          Search Grapes
        </Button>
      </div>
    </div>
  );
}
