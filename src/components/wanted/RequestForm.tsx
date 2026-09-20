"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GrapeVarietyOptionGroups, RegionOptionGroups } from "@/components/shared/SelectOptionGroups";
import { createWantedRequest } from "@/app/(dashboard)/requests/actions";
import { WANTED_MAX_REGIONS, WANTED_NOTES_MAX, wantedPriceUnit, wantedUnit, type WantedType } from "@/lib/wanted/schema";

export interface RequestFormInitial {
  type?: WantedType;
  variety?: string;
  region?: string;
  year?: string;
}

const PRACTICES = [
  { value: "", label: "No preference" },
  { value: "conventional", label: "Conventional" },
  { value: "sustainable", label: "Sustainable" },
  { value: "organic", label: "Organic" },
  { value: "biodynamic", label: "Biodynamic" },
] as const;

const checkboxClass = "mt-0.5 size-4 shrink-0 rounded border-stone-300 accent-[var(--color-brand)]";

export function RequestForm({ initial }: { initial: RequestFormInitial }) {
  const router = useRouter();
  const [type, setType] = useState<WantedType>(initial.type ?? "grapes");
  const [variety, setVariety] = useState(initial.variety ?? "");
  const [regions, setRegions] = useState<string[]>(initial.region ? [initial.region] : []);
  const [quantityMin, setQuantityMin] = useState("");
  const [quantityMax, setQuantityMax] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showPrice, setShowPrice] = useState(false);
  const [year, setYear] = useState(initial.year ?? "");
  const [practice, setPractice] = useState("");
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [alertMe, setAlertMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const unit = wantedUnit(type);
  const priceUnit = wantedPriceUnit(type);

  function addRegion(value: string) {
    if (!value || regions.includes(value) || regions.length >= WANTED_MAX_REGIONS) return;
    setRegions([...regions, value]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createWantedRequest({
      request_type: type,
      variety,
      regions,
      quantity_min: Number(quantityMin),
      quantity_max: quantityMax === "" ? null : Number(quantityMax),
      max_price: maxPrice === "" ? null : Number(maxPrice),
      show_price: showPrice,
      year: year === "" ? null : Number(year),
      farming_practice: practice === "" ? null : (practice as "conventional" | "sustainable" | "organic" | "biodynamic"),
      notes,
      is_anonymous: anonymous,
      alert_me: alertMe,
    });
    setSaving(false);
    if ("error" in result && result.error) {
      if ("needsUsername" in result && result.needsUsername) {
        router.push(`/choose-username?redirect_to=${encodeURIComponent("/wanted/new")}`);
        return;
      }
      setError(result.error);
      return;
    }
    router.push("/requests?posted=1");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-stone-900">What are you looking for?</legend>
        <div className="mt-2 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1" role="radiogroup" aria-label="Type">
          {(
            [
              ["grapes", "Wine grapes (by the ton)"],
              ["bulk_wine", "Bulk wine (by the gallon)"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setType(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${type === value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="variety">Variety</Label>
          <Select id="variety" value={variety} onChange={(e) => setVariety(e.target.value)} required>
            <option value="">Choose a variety</option>
            <GrapeVarietyOptionGroups />
          </Select>
        </div>
        <div>
          <Label htmlFor="year">{type === "bulk_wine" ? "Vintage" : "Harvest year"} (optional)</Label>
          <Input id="year" type="number" inputMode="numeric" min={2000} max={2100} placeholder="Any year" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="region">Regions (optional, up to {WANTED_MAX_REGIONS})</Label>
        <Select id="region" value="" onChange={(e) => addRegion(e.target.value)} disabled={regions.length >= WANTED_MAX_REGIONS}>
          <option value="">{regions.length === 0 ? "Any region" : "Add another region"}</option>
          <RegionOptionGroups />
        </Select>
        {regions.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {regions.map((region) => (
              <li key={region} className="flex items-center gap-1 rounded-full border border-stone-300 bg-white py-1 pl-3 pr-1.5 text-sm text-stone-700">
                {region}
                <button type="button" aria-label={`Remove ${region}`} onClick={() => setRegions(regions.filter((r) => r !== region))} className="rounded-full p-0.5 hover:bg-stone-100">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="qmin">Minimum {unit}</Label>
          <Input id="qmin" type="number" inputMode="decimal" min={0} step="any" required value={quantityMin} onChange={(e) => setQuantityMin(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="qmax">Maximum {unit} (optional)</Label>
          <Input id="qmax" type="number" inputMode="decimal" min={0} step="any" value={quantityMax} onChange={(e) => setQuantityMax(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Most you would pay per {priceUnit} (optional)</Label>
          <Input id="price" type="number" inputMode="decimal" min={0} step="any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          <label className="mt-2 flex items-start gap-2 text-sm text-stone-600">
            <input type="checkbox" className={checkboxClass} checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} disabled={maxPrice === ""} />
            Show this price on the request. Off by default; sellers can still ask.
          </label>
        </div>
        <div>
          <Label htmlFor="practice">Farming practice (optional)</Label>
          <Select id="practice" value={practice} onChange={(e) => setPractice(e.target.value)}>
            {PRACTICES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Anything else sellers should know (optional)</Label>
        <Textarea id="notes" rows={4} maxLength={WANTED_NOTES_MAX} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Timing, delivery region, spec targets such as brix or ABV. No phone numbers, emails or links: sellers reply through the site." />
        <p className="mt-1 text-xs text-stone-500">
          {notes.length}/{WANTED_NOTES_MAX}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <label className="flex items-start gap-2 text-sm text-stone-800">
          <input type="checkbox" className={checkboxClass} checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span>
            <span className="font-medium">Post anonymously.</span> Sellers see &ldquo;Anonymous buyer&rdquo; and reply through the site. You choose if and when to say who you are.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-800">
          <input type="checkbox" className={checkboxClass} checked={alertMe} onChange={(e) => setAlertMe(e.target.checked)} />
          <span>
            <span className="font-medium">Email me when a matching lot is listed.</span> Uses your email alerts, and you can stop them any time.
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={saving || !variety || quantityMin === ""}>
          {saving ? "Posting…" : "Post request"}
        </Button>
        <p className="text-xs text-stone-500">Open for 60 days. You can renew or close it any time.</p>
      </div>
    </form>
  );
}
