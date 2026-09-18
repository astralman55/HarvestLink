"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  PrimaryFilterFields,
  AdvancedFilterFields,
  type FilterValues,
  type FilterPatch,
} from "@/components/marketplace/ViticultureFilterFields";

function readValues(searchParams: URLSearchParams): FilterValues {
  const values: FilterValues = {};
  for (const key of [
    "region_ava",
    "variety",
    "farming_practice",
    "trellis_system",
    "soil_type",
    "sun_exposure",
    "harvest_year",
    "slope_min",
    "slope_max",
    "min_tons",
    "max_price",
    "min_brix",
    "hide_nda",
    "vineyard_name",
    "single_vineyard_only",
  ] as const) {
    const value = searchParams.get(key);
    if (value) values[key] = value;
  }
  return values;
}

function FilterFieldsPanel({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FilterValues>(() => readValues(searchParams));

  function apply(update: FilterPatch) {
    const next = { ...values };
    for (const [key, value] of Object.entries(update)) {
      if (value === undefined || value === "") {
        delete next[key as keyof FilterValues];
      } else {
        next[key as keyof FilterValues] = value;
      }
    }
    setValues(next);

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, String(value));
    }
    startTransition(() => {
      router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  function clearAll() {
    setValues({});
    startTransition(() => router.push(basePath));
  }

  const activeCount = Object.keys(values).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-stone-900">
          <SlidersHorizontal className="size-4" />
          Filters
          {isPending && <span className="text-xs font-normal text-stone-500">syncing…</span>}
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            <X className="size-3" /> Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <PrimaryFilterFields values={values} onChange={apply} />
      </div>

      <div className="space-y-4 border-t border-stone-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Viticulture Detail
        </p>
        <AdvancedFilterFields values={values} onChange={apply} />
      </div>
    </div>
  );
}

export function FilterPanel({ basePath = "/grapes" }: { basePath?: string }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5">
          <FilterFieldsPanel basePath={basePath} />
        </div>
      </aside>

      {/* Mobile drawer trigger */}
      <div className="mb-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Refine Results</SheetTitle>
            </SheetHeader>
            <FilterFieldsPanel basePath={basePath} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
