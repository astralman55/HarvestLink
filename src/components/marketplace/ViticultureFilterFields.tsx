"use client";

import { cloneElement, useId, type ReactElement } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { flags } from "@/lib/flags";
import {
  FARMING_PRACTICES,
  TRELLIS_SYSTEMS,
  SOIL_TYPES,
  SUN_EXPOSURES,
  SLOPE_BANDS,
  currentHarvestYearOptions,
} from "@/lib/constants/viticulture";
import { RegionOptionGroups, GrapeVarietyOptionGroups } from "@/components/shared/SelectOptionGroups";
import type { ListingSearchFilters } from "@/types";

export type FilterValues = ListingSearchFilters;
export type FilterPatch = Partial<FilterValues>;

interface FieldsProps {
  values: FilterValues;
  onChange: (patch: FilterPatch) => void;
}

// The <Label> here isn't nested around its control, so it needs an explicit
// htmlFor/id pairing to actually be an accessible name for the Select/Input
// -- a visible label with no programmatic association fails WCAG 4.1.2 /
// axe's select-name rule even though it looks fine sighted (Phase 7 a11y
// pass, Decision 40). useId() (not a slugified label) because FilterPanel
// mounts this same field set twice at once -- desktop sidebar and mobile
// Sheet drawer -- and a collided id would send the visible label's click
// to the other, hidden instance's control.
function FieldShell({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, { id })}
    </div>
  );
}

export function PrimaryFilterFields({ values, onChange }: FieldsProps) {
  return (
    <>
      <FieldShell label="Region">
        <Select
          value={values.region_ava ?? ""}
          onChange={(e) => onChange({ region_ava: e.target.value })}
        >
          <option value="">Any region</option>
          <RegionOptionGroups />
        </Select>
      </FieldShell>

      <FieldShell label="Grape Variety">
        <Select
          value={values.variety ?? ""}
          onChange={(e) => onChange({ variety: e.target.value })}
        >
          <option value="">Any variety</option>
          <GrapeVarietyOptionGroups />
        </Select>
      </FieldShell>

      <FieldShell label="Harvest Year">
        <Select
          value={values.harvest_year ?? ""}
          onChange={(e) => onChange({ harvest_year: e.target.value })}
        >
          <option value="">Any year</option>
          {currentHarvestYearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </FieldShell>
    </>
  );
}

function slopeBandValue(values: FilterValues) {
  const match = SLOPE_BANDS.find(
    (band) => String(band.min) === values.slope_min && String(band.max) === values.slope_max
  );
  return match?.value ?? "";
}

// Split out of AdvancedFilterFields so the homepage hero search (which
// wants these same five fields but its own tonnage/price/brix/vineyard
// treatment -- no vineyard name field, range sliders instead of plain
// number inputs) can compose them without duplicating this markup.
export function FarmingDetailFields({ values, onChange }: FieldsProps) {
  return (
    <>
      <FieldShell label="Farming Practice">
        <Select
          value={values.farming_practice ?? ""}
          onChange={(e) => onChange({ farming_practice: e.target.value })}
        >
          <option value="">Any practice</option>
          {FARMING_PRACTICES.map((practice) => (
            <option key={practice.value} value={practice.value}>
              {practice.label}
            </option>
          ))}
        </Select>
      </FieldShell>

      <FieldShell label="Trellis System">
        <Select
          value={values.trellis_system ?? ""}
          onChange={(e) => onChange({ trellis_system: e.target.value })}
        >
          <option value="">Any trellis</option>
          {TRELLIS_SYSTEMS.map((system) => (
            <option key={system} value={system}>
              {system}
            </option>
          ))}
        </Select>
      </FieldShell>

      <FieldShell label="Soil Type">
        <Select
          value={values.soil_type ?? ""}
          onChange={(e) => onChange({ soil_type: e.target.value })}
        >
          <option value="">Any soil</option>
          {SOIL_TYPES.map((soil) => (
            <option key={soil} value={soil}>
              {soil}
            </option>
          ))}
        </Select>
      </FieldShell>

      <FieldShell label="Sun Exposure">
        <Select
          value={values.sun_exposure ?? ""}
          onChange={(e) => onChange({ sun_exposure: e.target.value })}
        >
          <option value="">Any exposure</option>
          {SUN_EXPOSURES.map((exposure) => (
            <option key={exposure} value={exposure}>
              {exposure}
            </option>
          ))}
        </Select>
      </FieldShell>

      <FieldShell label="Slope">
        <Select
          value={slopeBandValue(values)}
          onChange={(e) => {
            const band = SLOPE_BANDS.find((b) => b.value === e.target.value);
            onChange({
              slope_min: band ? String(band.min) : undefined,
              slope_max: band ? String(band.max) : undefined,
            });
          }}
        >
          <option value="">Any slope</option>
          {SLOPE_BANDS.map((band) => (
            <option key={band.value} value={band.value}>
              {band.label}
            </option>
          ))}
        </Select>
      </FieldShell>
    </>
  );
}

export function AdvancedFilterFields({ values, onChange }: FieldsProps) {
  return (
    <>
      <FarmingDetailFields values={values} onChange={onChange} />

      <FieldShell label="Min. Tonnage">
        <Input
          type="number"
          min={0}
          placeholder="e.g. 5"
          value={values.min_tons ?? ""}
          onChange={(e) => onChange({ min_tons: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Max Price / Ton">
        <Input
          type="number"
          min={0}
          placeholder="e.g. 4000"
          value={values.max_price ?? ""}
          onChange={(e) => onChange({ max_price: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Min. Brix Target">
        <Input
          type="number"
          min={0}
          max={40}
          placeholder="e.g. 22"
          value={values.min_brix ?? ""}
          onChange={(e) => onChange({ min_brix: e.target.value })}
        />
      </FieldShell>

      <FieldShell label="Vineyard Name">
        <Input
          placeholder="e.g. To Kalon"
          value={values.vineyard_name ?? ""}
          onChange={(e) => onChange({ vineyard_name: e.target.value })}
        />
      </FieldShell>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
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
