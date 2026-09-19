"use client";

import { useId, useState } from "react";

// Conversion constants are exact definitions, not estimates.
const LITERS_PER_GALLON = 3.78541; // 1 US gallon
const BOTTLE_LITERS = 0.75; // standard wine bottle
const CASE_LITERS = 9; // 12 bottles
const BARREL_LITERS = 225; // standard Bordeaux-style barrique

// Practical yield range widely cited in extension and trade sources; see the post's sources.
const MIN_GAL_PER_TON = 130;
const MAX_GAL_PER_TON = 180;
const DEFAULT_GAL_PER_TON = 150;

const fmt = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

export function GallonsCalculator() {
  const id = useId();
  const [mode, setMode] = useState<"tons" | "cases">("tons");
  const [tons, setTons] = useState("10");
  const [cases, setCases] = useState("600");
  const [galPerTon, setGalPerTon] = useState(DEFAULT_GAL_PER_TON);

  const casesGallons = (Number(cases) * CASE_LITERS) / LITERS_PER_GALLON;
  const gallons = mode === "tons" ? Number(tons) * galPerTon : casesGallons;
  const safeGallons = Number.isFinite(gallons) && gallons > 0 ? gallons : 0;
  const liters = safeGallons * LITERS_PER_GALLON;
  const neededTons = safeGallons / galPerTon;

  const rows: [string, string][] =
    mode === "tons"
      ? [
          ["Gallons of wine", fmt(safeGallons)],
          ["Liters", fmt(liters)],
          ["750 mL bottles", fmt(liters / BOTTLE_LITERS)],
          ["Cases of 12 bottles", fmt(liters / CASE_LITERS, 1)],
          ["225 L barrels", fmt(liters / BARREL_LITERS, 1)],
        ]
      : [
          ["Tons of grapes needed", fmt(neededTons, 1)],
          ["Gallons of wine", fmt(safeGallons)],
          ["Liters", fmt(liters)],
          ["750 mL bottles", fmt(liters / BOTTLE_LITERS)],
          ["225 L barrels", fmt(liters / BARREL_LITERS, 1)],
        ];

  return (
    <section aria-labelledby={`${id}-title`} className="not-prose rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
      <h2 id={`${id}-title`} className="text-lg font-semibold text-stone-900">
        Tons to gallons calculator
      </h2>
      <p className="mt-1 text-sm text-stone-600">Estimates only. Real yield depends on the grapes, the press, and cellar losses.</p>

      <div className="mt-4 inline-flex rounded-full border border-stone-300 bg-white p-1 text-sm" role="group" aria-label="Calculator mode">
        {(
          [
            ["tons", "I have tons"],
            ["cases", "I want cases"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              mode === value ? "bg-[var(--color-brand)] text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {mode === "tons" ? (
          <div>
            <label htmlFor={`${id}-tons`} className="block text-sm font-medium text-stone-800">
              Tons of grapes
            </label>
            <input
              id={`${id}-tons`}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={tons}
              onChange={(event) => setTons(event.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-900"
            />
          </div>
        ) : (
          <div>
            <label htmlFor={`${id}-cases`} className="block text-sm font-medium text-stone-800">
              Cases of 12 bottles wanted
            </label>
            <input
              id={`${id}-cases`}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={cases}
              onChange={(event) => setCases(event.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-900"
            />
          </div>
        )}
        <div>
          <label htmlFor={`${id}-yield`} className="block text-sm font-medium text-stone-800">
            Gallons of wine per ton: <span className="font-semibold">{galPerTon}</span>
          </label>
          <input
            id={`${id}-yield`}
            type="range"
            min={MIN_GAL_PER_TON}
            max={MAX_GAL_PER_TON}
            step={1}
            value={galPerTon}
            onChange={(event) => setGalPerTon(Number(event.target.value))}
            className="mt-3 w-full accent-[var(--color-brand)]"
          />
          <div className="flex justify-between text-xs text-stone-500">
            <span>{MIN_GAL_PER_TON}</span>
            <span>{MAX_GAL_PER_TON}</span>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-live="polite">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
            <dt className="text-xs text-stone-500">{label}</dt>
            <dd className="mt-0.5 text-xl font-semibold text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-stone-500">
        Formula: gallons = tons × gallons per ton. One US gallon is 3.78541 liters, a bottle is 0.75 L, a 12-bottle case is 9 L, and a
        standard barrel is 225 L.
      </p>
    </section>
  );
}
