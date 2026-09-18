"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateListingSchema, type CreateListingInput } from "@/lib/validation/listing";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateListingTitle } from "@/lib/utils";
import {
  FARMING_PRACTICES,
  TRELLIS_SYSTEMS,
  SOIL_TYPES,
  SUN_EXPOSURES,
  currentHarvestYearOptions,
  getSubAvasForRegion,
} from "@/lib/constants/viticulture";
import { RegionOptionGroups, GrapeVarietyOptionGroups } from "@/components/shared/SelectOptionGroups";

const LISTING_STATUSES = ["available", "pending", "sold", "archived"] as const;

interface ListingFormProps {
  defaultValues?: Partial<CreateListingInput>;
  onSubmit: (data: CreateListingInput) => Promise<{ error?: string } | void>;
  submitLabel: string;
  submittingLabel: string;
  showStatusField?: boolean;
}

export function ListingForm({
  defaultValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  showStatusField = false,
}: ListingFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(CreateListingSchema),
    defaultValues: { minimum_tons: 1, farming_practice: "conventional", ...defaultValues },
  });

  const selectedRegion = watch("region_ava");
  const subAvaOptions = getSubAvasForRegion(selectedRegion);

  useEffect(() => {
    if (selectedRegion !== defaultValues?.region_ava) {
      setValue("sub_ava", "");
    }
    // Only reset the sub-AVA when the region actually changes away from
    // whatever it was pre-filled with — not on the initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, setValue]);

  const generatedTitle = generateListingTitle(
    watch("variety"),
    watch("clone"),
    watch("sub_ava") || selectedRegion
  );

  async function handleFormSubmit(data: CreateListingInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-8 space-y-8">
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Listing Title (auto-generated)
        </p>
        <p className="mt-1 text-sm font-medium text-stone-900">
          {generatedTitle || "Select a grape variety and region below to generate a title"}
        </p>
      </div>

      {showStatusField && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-900">Status</h2>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="status">Listing Status</Label>
            <Select id="status" {...register("status")}>
              {LISTING_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Listing Basics</h2>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Describe the block, farming history, and fruit character…" {...register("description")} />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <h2 className="col-span-full text-sm font-semibold text-stone-900">Variety &amp; Origin</h2>
        <div className="space-y-1.5">
          <Label htmlFor="variety">Grape Variety</Label>
          <Select id="variety" {...register("variety")}>
            <option value="">Select variety</option>
            <GrapeVarietyOptionGroups />
          </Select>
          {errors.variety && <p className="text-xs text-red-600">{errors.variety.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region_ava">Region (AVA)</Label>
          <Select id="region_ava" {...register("region_ava")}>
            <option value="">Select region</option>
            <RegionOptionGroups />
          </Select>
          {errors.region_ava && <p className="text-xs text-red-600">{errors.region_ava.message}</p>}
        </div>
        {subAvaOptions.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="sub_ava">Sub-AVA (optional)</Label>
            <Select id="sub_ava" {...register("sub_ava")}>
              <option value="">No sub-AVA</option>
              {subAvaOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="clone">Clone</Label>
          <Input id="clone" placeholder="e.g. Dijon 777" {...register("clone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rootstock">Rootstock</Label>
          <Input id="rootstock" placeholder="e.g. 110R" {...register("rootstock")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="harvest_year">Harvest Year</Label>
          <Select id="harvest_year" {...register("harvest_year")}>
            {currentHarvestYearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <h2 className="col-span-full text-sm font-semibold text-stone-900">Vineyard Detail</h2>
        <div className="space-y-1.5">
          <Label htmlFor="farming_practice">Farming Practice</Label>
          <Select id="farming_practice" {...register("farming_practice")}>
            {FARMING_PRACTICES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trellis_system">Trellis System</Label>
          <Select id="trellis_system" {...register("trellis_system")}>
            <option value="">Select trellis</option>
            {TRELLIS_SYSTEMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="soil_type">Soil Type</Label>
          <Select id="soil_type" {...register("soil_type")}>
            <option value="">Select soil</option>
            {SOIL_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sun_exposure">Sun Exposure</Label>
          <Select id="sun_exposure" {...register("sun_exposure")}>
            <option value="">Select exposure</option>
            {SUN_EXPOSURES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slope_percent">Slope (%)</Label>
          <Input id="slope_percent" type="number" min={0} max={100} placeholder="e.g. 12" {...register("slope_percent")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brix_target">Brix Target</Label>
          <Input id="brix_target" type="number" min={10} max={40} step={0.1} placeholder="e.g. 24.5" {...register("brix_target")} />
          {errors.brix_target && <p className="text-xs text-red-600">{errors.brix_target.message}</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <h2 className="col-span-full text-sm font-semibold text-stone-900">Tonnage &amp; Pricing</h2>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_tons">Estimated Tons</Label>
          <Input id="estimated_tons" type="number" min={0} step={0.1} placeholder="e.g. 25" {...register("estimated_tons")} />
          {errors.estimated_tons && <p className="text-xs text-red-600">{errors.estimated_tons.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minimum_tons">Minimum Order (Tons)</Label>
          <Input id="minimum_tons" type="number" min={0} step={0.1} {...register("minimum_tons")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price_per_ton">Price / Ton (USD)</Label>
          <Input id="price_per_ton" type="number" min={0} step={1} placeholder="e.g. 3200" {...register("price_per_ton")} />
          {errors.price_per_ton && <p className="text-xs text-red-600">{errors.price_per_ton.message}</p>}
        </div>
      </section>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
