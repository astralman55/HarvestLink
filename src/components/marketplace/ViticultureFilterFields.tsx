"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

function FieldShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function PrimaryFilterFields({ values, onChange }: FieldsProps) {
  return (
    <>
      <FieldShell label="Region (AVA)">
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

export function AdvancedFilterFields({ values, onChange }: FieldsProps) {
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
    </>
  );
}
