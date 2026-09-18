"use client";

import { Controller, type Control, type UseFormRegister } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CreateListingInput } from "@/lib/validation/listing";

interface NdaFieldsProps {
  control: Control<CreateListingInput>;
  register: UseFormRegister<CreateListingInput>;
  isNda: boolean;
}

/**
 * NDA-1: the "Selling under NDA?" control plus its live "what buyers will
 * see" panel (Appendix A copy). Kept as its own small, keyboard-accessible
 * section near where the vineyard field will land in Phase 4.
 */
export function NdaFields({ control, register, isNda }: NdaFieldsProps) {
  return (
    <section className="space-y-4 rounded-xl border border-stone-200 p-4">
      <h2 className="text-sm font-semibold text-stone-900">Seller &amp; Source</h2>

      <Controller
        control={control}
        name="is_nda"
        render={({ field }) => (
          <label htmlFor="is_nda" className="flex cursor-pointer items-start gap-3">
            <Checkbox id="is_nda" checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium text-stone-900">Selling under NDA?</span>
              <span className="mt-0.5 block text-xs text-stone-500">
                Your name, business, and vineyard will be hidden from buyers. Buyers contact you through the site.
              </span>
            </span>
          </label>
        )}
      />

      {isNda && (
        <div className="space-y-4 rounded-lg bg-amber-50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="nda_location_precision" className="text-xs uppercase tracking-wide text-amber-800">
              Location shown to buyers
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-stone-700">
                <input type="radio" value="county" {...register("nda_location_precision")} /> County &amp; region
              </label>
              <label className="flex items-center gap-1.5 text-sm text-stone-700">
                <input type="radio" value="state" {...register("nda_location_precision")} /> State only
              </label>
            </div>
            <p className="text-xs text-amber-800">
              In areas with few wineries, a county may still make you identifiable. Choose &quot;State only&quot; for maximum privacy.
            </p>
          </div>

          <div className="border-t border-amber-200 pt-3 text-xs text-amber-900">
            <p className="font-semibold uppercase tracking-wide">What buyers will see</p>
            <p className="mt-1">
              <span className="font-medium">Hidden:</span> your name, business, username, vineyard name, contact info, and exact
              location.
            </p>
            <p className="mt-1">
              <span className="font-medium">Visible:</span> varietal, vintage, quantity, price, region, and the details you enter
              below.
            </p>
            <p className="mt-2">Avoid mentioning your winery, vineyard, brand, or anything else that could identify you, including in photos.</p>
          </div>
        </div>
      )}
    </section>
  );
}
