"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Search, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RangeSliderField } from "@/components/marketplace/RangeSliderField";
import { flags } from "@/lib/flags";
import {
  BulkWinePrimaryFilterFields,
  SulfitesAndPracticeFields,
  type FilterValues,
  type FilterPatch,
} from "@/components/marketplace/BulkWineFilterFields";

const CURRENT_YEAR = new Date().getFullYear();

const QUICK_FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: "Organic Chardonnay", params: { variety: "Chardonnay", farming_practices: "organic" } },
  { label: "Sonoma County", params: { region_ava: "Sonoma County" } },
  { label: "Biodynamic Pinot Noir", params: { variety: "Pinot Noir", farming_practices: "biodynamic" } },
  { label: `${CURRENT_YEAR} Vintage`, params: { vintage_year: String(CURRENT_YEAR) } },
];

/** The bulk-wine equivalent of GrapeSearchHero, shown on the homepage when
 * the header switch's "Bulk Wine" option is active (query-param toggle on
 * "/", no separate route). */
export function BulkWineSearchHero() {
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
    router.push(`/bulk-wine${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BulkWinePrimaryFilterFields values={values} onChange={patch} />
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--color-brand)]"
      >
        <SlidersHorizontal className="size-4" />
        Farming practice, sulfites &amp; more
        <ChevronUp className={`size-4 transition-transform ${advancedOpen ? "" : "rotate-180"}`} />
      </button>

      {advancedOpen && (
        <div className="mt-4 space-y-5 border-t border-stone-100 pt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SulfitesAndPracticeFields values={values} onChange={patch} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <RangeSliderField
              label="ABV %"
              min={5}
              max={25}
              step={0.1}
              minValue={values.abv_min}
              maxValue={values.abv_max}
              onChange={(min, max) => patch({ abv_min: min, abv_max: max })}
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
            <RangeSliderField
              label="Price / Gal (USD)"
              min={0}
              max={50}
              step={0.5}
              minValue={values.min_price}
              maxValue={values.max_price}
              onChange={(min, max) => patch({ min_price: min, max_price: max })}
              formatValue={(v) => `$${v.toFixed(2)}`}
            />
            <RangeSliderField
              label="Quantity (gal)"
              min={0}
              max={100000}
              step={500}
              minValue={values.min_gallons}
              maxValue={values.max_gallons}
              onChange={(min, max) => patch({ min_gallons: min, max_gallons: max })}
              formatValue={(v) => `${v.toLocaleString()} gal`}
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
              <Checkbox
                checked={values.single_vineyard_only === "true"}
                onCheckedChange={(checked) => patch({ single_vineyard_only: checked ? "true" : undefined })}
              />
              Single vineyard only
            </label>

            {flags.ndaListings && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                <Checkbox
                  checked={values.hide_nda === "true"}
                  onCheckedChange={(checked) => patch({ hide_nda: checked ? "true" : undefined })}
                />
                Exclude NDA listings
              </label>
            )}
          </div>
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
          Search Bulk Wine
        </Button>
      </div>
    </div>
  );
}
