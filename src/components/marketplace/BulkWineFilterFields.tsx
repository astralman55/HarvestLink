"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RegionOptionGroups, GrapeVarietyOptionGroups } from "@/components/shared/SelectOptionGroups";
import { US_STATES, BULK_WINE_FARMING_PRACTICES, currentVintageYearOptions } from "@/lib/constants/bulk-wine";
import { flags } from "@/lib/flags";
import type { ListingSearchFilters } from "@/types";

export type FilterValues = ListingSearchFilters;
export type FilterPatch = Partial<FilterValues>;

interface FieldsProps {
  values: FilterValues;
  onChange: (patch: FilterPatch) => void;
}

function FieldShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// 6.5: bulk wine's own browse filter set -- varietal, vintage, grape
// origin, wine location, ABV/price/quantity ranges, farming practice
// (any-of), max sulfites, single vineyard, NDA include/exclude.
export function BulkWinePrimaryFilterFields({ values, onChange }: FieldsProps) {
  return (
    <>
      <FieldShell label="Grape Variety">
        <Select value={values.variety ?? ""} onChange={(e) => onChange({ variety: e.target.value })}>
          <option value="">Any variety</option>
          <GrapeVarietyOptionGroups />
        </Select>
      </FieldShell>

      <FieldShell label="Vintage">
        <Select value={values.vintage_year ?? ""} onChange={(e) => onChange({ vintage_year: e.target.value })}>
          <option value="">Any vintage</option>
          {currentVintageYearOptions().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </FieldShell>

      <FieldShell label="Grape Origin (AVA)">
        <Select value={values.region_ava ?? ""} onChange={(e) => onChange({ region_ava: e.target.value })}>
          <option value="">Any region</option>
          <RegionOptionGroups />
        </Select>
      </FieldShell>
    </>
  );
}

export function BulkWineAdvancedFilterFields({ values, onChange }: FieldsProps) {
  const selectedPractices = values.farming_practices ? values.farming_practices.split(",").filter(Boolean) : [];

  function togglePractice(code: string, checked: boolean) {
    const next = checked ? [...selectedPractices, code] : selectedPractices.filter((c) => c !== code);
    onChange({ farming_practices: next.length > 0 ? next.join(",") : undefined });
  }

  return (
    <>
      <FieldShell label="Wine Location (State)">
        <Select value={values.wine_location_state ?? ""} onChange={(e) => onChange({ wine_location_state: e.target.value })}>
          <option value="">Any state</option>
          {US_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      </FieldShell>

      <FieldShell label="Wine Location (County)">
        <Input
          placeholder="e.g. Sonoma"
          value={values.wine_location_county ?? ""}
          onChange={(e) => onChange({ wine_location_county: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Min. ABV %">
        <Input
          type="number"
          min={5}
          max={25}
          step={0.1}
          placeholder="e.g. 12"
          value={values.abv_min ?? ""}
          onChange={(e) => onChange({ abv_min: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Max. ABV %">
        <Input
          type="number"
          min={5}
          max={25}
          step={0.1}
          placeholder="e.g. 16"
          value={values.abv_max ?? ""}
          onChange={(e) => onChange({ abv_max: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Max Price / Gal">
        <Input
          type="number"
          min={0}
          step={0.01}
          placeholder="e.g. 6.00"
          value={values.max_price ?? ""}
          onChange={(e) => onChange({ max_price: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Min. Quantity (gal)">
        <Input
          type="number"
          min={0}
          placeholder="e.g. 1000"
          value={values.min_gallons ?? ""}
          onChange={(e) => onChange({ min_gallons: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Max. Quantity (gal)">
        <Input
          type="number"
          min={0}
          placeholder="e.g. 50000"
          value={values.max_gallons ?? ""}
          onChange={(e) => onChange({ max_gallons: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Max Total Sulfites (ppm)">
        <Input
          type="number"
          min={0}
          max={1000}
          placeholder="e.g. 350"
          value={values.max_so2 ?? ""}
          onChange={(e) => onChange({ max_so2: e.target.value })}
        />
      </FieldShell>

      <div className="space-y-1.5 sm:col-span-2">
        <Label>Farming Practice</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BULK_WINE_FARMING_PRACTICES.map((practice) => (
            <label key={practice.value} className="flex items-center gap-2 text-sm text-stone-700">
              <Checkbox
                checked={selectedPractices.includes(practice.value)}
                onCheckedChange={(checked) => togglePractice(practice.value, checked === true)}
              />
              {practice.label}
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-stone-700">
        <Checkbox
          checked={values.single_vineyard_only === "true"}
          onCheckedChange={(checked) => onChange({ single_vineyard_only: checked ? "true" : undefined })}
        />
        Single vineyard only
      </label>

      {flags.ndaListings && (
        <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-stone-700">
          <Checkbox
            checked={values.hide_nda === "true"}
            onCheckedChange={(checked) => onChange({ hide_nda: checked ? "true" : undefined })}
          />
          Exclude NDA listings
        </label>
      )}
    </>
  );
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price / Gal: Low to High" },
  { value: "price_desc", label: "Price / Gal: High to Low" },
  { value: "quantity", label: "Quantity: High to Low" },
  { value: "abv", label: "ABV: High to Low" },
] as const;

export function BulkWineSortSelect({ values, onChange }: FieldsProps) {
  return (
    <FieldShell label="Sort By">
      <Select value={values.sort ?? "newest"} onChange={(e) => onChange({ sort: e.target.value })}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </FieldShell>
  );
}
