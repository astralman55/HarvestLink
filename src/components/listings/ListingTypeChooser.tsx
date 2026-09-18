"use client";

import { Grape, Wine } from "lucide-react";
import type { ListingType } from "@/types";

interface ListingTypeChooserProps {
  onChoose: (type: ListingType) => void;
}

/** WINE-4: "/sell shows two large choice cards" (Appendix A copy). */
export function ListingTypeChooser({ onChoose }: ListingTypeChooserProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onChoose("grapes")}
        className="flex flex-col items-start gap-3 rounded-2xl border border-stone-200 p-6 text-left transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-50)]"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand)]">
          <Grape className="size-5" />
        </span>
        <span className="font-semibold text-stone-900">Sell Grapes</span>
        <span className="text-sm text-stone-500">Priced per ton.</span>
      </button>

      <button
        type="button"
        onClick={() => onChoose("bulk_wine")}
        className="flex flex-col items-start gap-3 rounded-2xl border border-stone-200 p-6 text-left transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-50)]"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand)]">
          <Wine className="size-5" />
        </span>
        <span className="font-semibold text-stone-900">Sell Bulk Wine</span>
        <span className="text-sm text-stone-500">Priced per gallon.</span>
      </button>
    </div>
  );
}
