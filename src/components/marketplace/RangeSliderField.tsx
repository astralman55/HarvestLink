"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RangeSliderFieldProps {
  label: string;
  min: number;
  max: number;
  step: number;
  minValue?: string;
  maxValue?: string;
  onChange: (min: string | undefined, max: string | undefined) => void;
  formatValue?: (value: number) => string;
}

/** Homepage hero search: drag-to-search min/max windows for tonnage, price,
 * and brix, instead of typed number inputs. A value at the slider's outer
 * bound is treated as "no bound set" so it doesn't add a no-op filter param. */
export function RangeSliderField({ label, min, max, step, minValue, maxValue, onChange, formatValue }: RangeSliderFieldProps) {
  const currentMin = minValue !== undefined ? Number(minValue) : min;
  const currentMax = maxValue !== undefined ? Number(maxValue) : max;
  const format = formatValue ?? ((value: number) => String(value));

  function handleValueChange([nextMin, nextMax]: number[]) {
    onChange(nextMin > min ? String(nextMin) : undefined, nextMax < max ? String(nextMax) : undefined);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs font-medium text-stone-600">
          {format(currentMin)} – {format(currentMax)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        value={[currentMin, currentMax]}
        onValueChange={handleValueChange}
        aria-label={label}
      />
    </div>
  );
}
