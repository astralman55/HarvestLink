"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBulkWineListingSchema, type CreateBulkWineListingInput } from "@/lib/validation/bulk-wine";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { generateBulkWineTitle, formatCurrencyPrecise, computeTotalLotValue } from "@/lib/utils";
import { BULK_WINE_FARMING_PRACTICES, currentVintageYearOptions } from "@/lib/constants/bulk-wine";
import { RegionOptionGroups, GrapeVarietyOptionGroups } from "@/components/shared/SelectOptionGroups";
import { NdaFields } from "@/components/listings/NdaFields";
import { NdaPreviewDialog } from "@/components/listings/NdaPreviewDialog";
import { NdaToggleConfirmDialog } from "@/components/listings/NdaToggleConfirmDialog";
import { VineyardField } from "@/components/listings/VineyardField";
import { flags } from "@/lib/flags";
import type { Listing } from "@/types";

const LISTING_STATUSES = ["available", "pending", "sold", "archived"] as const;

interface BulkWineFormProps {
  defaultValues?: Partial<CreateBulkWineListingInput>;
  onSubmit: (data: CreateBulkWineListingInput) => Promise<{ error?: string } | void>;
  submitLabel: string;
  submittingLabel: string;
  showStatusField?: boolean;
  originalIsNda?: boolean;
}

export function BulkWineForm({
  defaultValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  showStatusField = false,
  originalIsNda,
}: BulkWineFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<CreateBulkWineListingInput | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<"on" | "off" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBulkWineListingInput>({
    resolver: zodResolver(CreateBulkWineListingSchema),
    defaultValues: {
      is_nda: false,
      nda_location_precision: "county",
      single_vineyard: false,
      is_multi_vintage: false,
      farming_practices: [],
      ...defaultValues,
    },
  });

  const selectedRegion = watch("region_ava");
  const isNda = watch("is_nda");
  const singleVineyard = watch("single_vineyard");
  const isMultiVintage = watch("is_multi_vintage");
  const quantity = Number(watch("quantity_gallons") || 0);
  const price = Number(watch("price_per_gallon") || 0);
  const abv = Number(watch("abv") || 0);
  const so2 = watch("total_so2_ppm");
  const farmingPractices = watch("farming_practices") ?? [];

  const watchedVintageYear = watch("vintage_year");
  const generatedTitle = generateBulkWineTitle(
    watch("variety"),
    watchedVintageYear ? Number(watchedVintageYear) : undefined,
    isMultiVintage,
    selectedRegion
  );
  const totalLotValue = quantity > 0 && price > 0 ? computeTotalLotValue(quantity, price) : null;

  function toggleFarmingPractice(value: string, checked: boolean) {
    const current = watch("farming_practices") ?? [];
    let next = checked ? [...current, value] : current.filter((v) => v !== value);
    // WINE-6: selecting Demeter auto-checks Biodynamic (can be unchecked manually).
    if (value === "demeter_certified_biodynamic" && checked && !next.includes("biodynamic")) {
      next = [...next, "biodynamic"];
    }
    setValue("farming_practices", [...new Set(next)] as CreateBulkWineListingInput["farming_practices"]);
  }

  async function finalSubmit(data: CreateBulkWineListingInput) {
    setServerError(null);
    setSubmittingFinal(true);
    const result = await onSubmit(data);
    setSubmittingFinal(false);
    if (result?.error) setServerError(result.error);
  }

  async function proceedPastToggleCheck(data: CreateBulkWineListingInput) {
    if (data.is_nda) {
      setPendingData(data);
      setShowPreview(true);
      return;
    }
    await finalSubmit(data);
  }

  async function handleFormSubmit(data: CreateBulkWineListingInput) {
    setServerError(null);
    if (originalIsNda !== undefined && originalIsNda !== data.is_nda) {
      setPendingData(data);
      setToggleConfirm(data.is_nda ? "on" : "off");
      return;
    }
    await proceedPastToggleCheck(data);
  }

  const previewRow: Listing | null = pendingData
    ? ({
        id: "preview",
        user_id: "preview",
        title: generatedTitle || "Untitled Bulk Wine Lot",
        created_at: new Date().toISOString(),
        status: "available",
        listing_type: "bulk_wine",
        clone: null,
        rootstock: null,
        sub_ava: pendingData.sub_ava || null,
        brix_target: null,
        description: pendingData.description ?? null,
        trellis_system: null,
        soil_type: null,
        sun_exposure: null,
        slope_percent: null,
        single_vineyard: pendingData.single_vineyard ?? false,
        vineyard_name: pendingData.single_vineyard ? pendingData.vineyard_name || null : null,
        vineyard_name_normalized: null,
        variety: pendingData.variety,
        region_ava: pendingData.region_ava,
        estimated_tons: 0,
        minimum_tons: 0,
        price_per_ton: 0,
        farming_practice: "conventional",
        harvest_year: Number(pendingData.vintage_year) || new Date().getFullYear(),
        is_nda: pendingData.is_nda ?? false,
        nda_location_precision: pendingData.nda_location_precision ?? "county",
        bulk_wine_details: {
          listing_id: "preview",
          quantity_gallons: Number(pendingData.quantity_gallons) || 0,
          price_per_gallon: Number(pendingData.price_per_gallon) || 0,
          abv: Number(pendingData.abv) || 0,
          total_so2_ppm: pendingData.total_so2_ppm != null ? Number(pendingData.total_so2_ppm) : null,
          vintage_year: pendingData.is_multi_vintage ? null : Number(pendingData.vintage_year) || null,
          is_multi_vintage: pendingData.is_multi_vintage ?? false,
          wine_location_state: pendingData.wine_location_state ?? null,
          wine_location_county: pendingData.wine_location_county ?? null,
          created_at: new Date().toISOString(),
        },
        listing_farming_practices: (pendingData.farming_practices ?? []).map((code) => ({ practice_code: code })),
      } as Listing)
    : null;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-8 space-y-8">
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Listing Title (auto-generated)</p>
        <p className="mt-1 text-sm font-medium text-stone-900">
          {generatedTitle || "Select a grape variety, vintage, and grape origin below to generate a title"}
        </p>
      </div>

      {showStatusField && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-900">Status</h2>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="status">Listing Status</Label>
            <Select id="status" {...register("status")}>
              {LISTING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-stone-200 p-4">
        <h2 className="text-sm font-semibold text-stone-900">Seller &amp; Source</h2>
        <VineyardField
          singleVineyard={!!singleVineyard}
          onSingleVineyardChange={(value) => setValue("single_vineyard", value)}
          vineyardName={watch("vineyard_name") ?? ""}
          onVineyardNameChange={(value) => setValue("vineyard_name", value)}
          error={errors.vineyard_name?.message}
        />
        {flags.ndaListings && (
          <NdaFields
            isNda={!!isNda}
            onIsNdaChange={(value) => setValue("is_nda", value)}
            ndaLocationPrecision={watch("nda_location_precision") ?? "county"}
            onNdaLocationPrecisionChange={(value) => setValue("nda_location_precision", value)}
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Listing Basics</h2>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Describe the lot, production history, and style…" {...register("description")} />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <h2 className="col-span-full text-sm font-semibold text-stone-900">Varietal &amp; Region</h2>
        <div className="space-y-1.5">
          <Label htmlFor="variety">Grape Variety</Label>
          <Select id="variety" {...register("variety")}>
            <option value="">Select variety</option>
            <GrapeVarietyOptionGroups />
          </Select>
          {errors.variety && <p className="text-xs text-red-600">{errors.variety.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region_ava">Region</Label>
          <Select id="region_ava" {...register("region_ava")}>
            <option value="">Select region</option>
            <RegionOptionGroups />
          </Select>
          {errors.region_ava && <p className="text-xs text-red-600">{errors.region_ava.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sub_ava">Specific Area (optional)</Label>
          <Input id="sub_ava" placeholder="e.g. Rutherford, Estate Block 4" {...register("sub_ava")} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <h2 className="col-span-full text-sm font-semibold text-stone-900">Wine Specs</h2>
        <div className="space-y-1.5">
          <Label htmlFor="vintage_year">Vintage</Label>
          <Select
            id="vintage_year"
            disabled={!!isMultiVintage}
            {...register("vintage_year")}
          >
            <option value="">Select vintage</option>
            {currentVintageYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          {errors.vintage_year && <p className="text-xs text-red-600">{errors.vintage_year.message}</p>}
          <label className="flex items-center gap-2 pt-1 text-sm text-stone-700">
            <Checkbox
              checked={!!isMultiVintage}
              onCheckedChange={(checked) => setValue("is_multi_vintage", checked === true)}
            />
            Non-vintage / multi-vintage blend
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="abv">Alcohol % (ABV)</Label>
          <Input id="abv" type="number" min={5} max={25} step={0.1} placeholder="e.g. 13.5" {...register("abv")} />
          {errors.abv && <p className="text-xs text-red-600">{errors.abv.message}</p>}
          {abv > 0 && (abv < 9 || abv > 16) && !errors.abv && (
            <p className="text-xs text-amber-700">That&apos;s outside the usual range. Please double-check.</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="total_so2_ppm">Total Sulfites (Total SO₂), ppm</Label>
          <Input id="total_so2_ppm" type="number" min={0} max={1000} placeholder="e.g. 80" className="max-w-xs" {...register("total_so2_ppm")} />
          <p className="text-xs text-stone-500">From your lab analysis, if you have it. Leave blank if not tested.</p>
          {errors.total_so2_ppm && <p className="text-xs text-red-600">{errors.total_so2_ppm.message}</p>}
          {so2 != null && Number(so2) > 350 && !errors.total_so2_ppm && (
            <p className="text-xs text-amber-700">This is above common regulatory limits. Please double-check.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Farming Practices</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BULK_WINE_FARMING_PRACTICES.map((practice) => (
            <label key={practice.value} className="flex items-center gap-2 text-sm text-stone-700">
              <Checkbox
                checked={farmingPractices.includes(practice.value)}
                onCheckedChange={(checked) => toggleFarmingPractice(practice.value, checked === true)}
              />
              {practice.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-stone-500">Practices and certifications are declared by the seller. Buyers should request documentation.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <h2 className="col-span-full text-sm font-semibold text-stone-900">Quantity &amp; Pricing</h2>
        <div className="space-y-1.5">
          <Label htmlFor="quantity_gallons">Quantity (gal)</Label>
          <Input id="quantity_gallons" type="number" min={1} max={5_000_000} step={1} placeholder="e.g. 5000" {...register("quantity_gallons")} />
          {errors.quantity_gallons && <p className="text-xs text-red-600">{errors.quantity_gallons.message}</p>}
          {quantity > 250_000 && !errors.quantity_gallons && (
            <p className="text-xs text-amber-700">That&apos;s a large lot -- is that right?</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price_per_gallon">Price / Gallon (USD)</Label>
          <Input id="price_per_gallon" type="number" min={0.01} max={1000} step={0.01} placeholder="e.g. 4.25" {...register("price_per_gallon")} />
          {errors.price_per_gallon && <p className="text-xs text-red-600">{errors.price_per_gallon.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Total Lot Value</Label>
          <p className="flex h-11 items-center text-lg font-semibold text-stone-900">
            {totalLotValue != null ? `≈ ${formatCurrencyPrecise(totalLotValue)}` : "—"}
          </p>
        </div>
        <p className="col-span-full text-xs text-stone-500">1 gallon = US liquid gallon.</p>
      </section>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting || submittingFinal}>
        {isSubmitting || submittingFinal ? submittingLabel : submitLabel}
      </Button>

      <NdaToggleConfirmDialog
        direction={toggleConfirm}
        onCancel={() => {
          setToggleConfirm(null);
          setPendingData(null);
        }}
        onConfirm={() => {
          setToggleConfirm(null);
          if (pendingData) proceedPastToggleCheck(pendingData);
        }}
      />

      {previewRow && (
        <NdaPreviewDialog
          open={showPreview}
          onOpenChange={(open) => {
            setShowPreview(open);
            if (!open) setPendingData(null);
          }}
          previewRow={previewRow}
          submitting={submittingFinal}
          onConfirm={() => {
            setShowPreview(false);
            if (pendingData) finalSubmit(pendingData);
          }}
        />
      )}
    </form>
  );
}
