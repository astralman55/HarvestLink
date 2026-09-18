"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { NdaLocationPrecision } from "@/types";

interface NdaFieldsProps {
  isNda: boolean;
  onIsNdaChange: (value: boolean) => void;
  ndaLocationPrecision: NdaLocationPrecision;
  onNdaLocationPrecisionChange: (value: NdaLocationPrecision) => void;
}

/**
 * NDA-1: the "Selling under NDA?" control plus its live "what buyers will
 * see" panel (Appendix A copy). Rendered inside the same "Seller & Source"
 * section as VineyardField, right below it, per the spec's own placement
 * note ("near the vineyard field"). Plain controlled props (not
 * react-hook-form's Control/register) so it's reusable as-is by both the
 * grapes form and the bulk-wine form (Phase 5), which have two different
 * schemas.
 */
export function NdaFields({ isNda, onIsNdaChange, ndaLocationPrecision, onNdaLocationPrecisionChange }: NdaFieldsProps) {
  return (
    <div className="space-y-4">
      <label htmlFor="is_nda" className="flex cursor-pointer items-start gap-3">
        <Checkbox id="is_nda" checked={isNda} onCheckedChange={(checked) => onIsNdaChange(checked === true)} className="mt-0.5" />
        <span>
          <span className="block text-sm font-medium text-stone-900">Selling under NDA?</span>
          <span className="mt-0.5 block text-xs text-stone-500">
            Your name, business, and vineyard will be hidden from buyers. Buyers contact you through the site.
          </span>
        </span>
      </label>

      {isNda && (
        <div className="space-y-4 rounded-lg bg-amber-50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="nda_location_precision" className="text-xs uppercase tracking-wide text-amber-800">
              Location shown to buyers
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-stone-700">
                <input
                  type="radio"
                  checked={ndaLocationPrecision === "county"}
                  onChange={() => onNdaLocationPrecisionChange("county")}
                />{" "}
                County &amp; region
              </label>
              <label className="flex items-center gap-1.5 text-sm text-stone-700">
                <input
                  type="radio"
                  checked={ndaLocationPrecision === "state"}
                  onChange={() => onNdaLocationPrecisionChange("state")}
                />{" "}
                State only
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
    </div>
  );
}
