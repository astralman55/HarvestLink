"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VINEYARD_NAME_HELPER } from "@/lib/validation/vineyard";
import { getVineyardNameSuggestions } from "@/app/(dashboard)/listings/vineyard-actions";

interface VineyardFieldProps {
  singleVineyard: boolean;
  onSingleVineyardChange: (value: boolean) => void;
  vineyardName: string;
  onVineyardNameChange: (value: string) => void;
  error?: string;
}

/**
 * VIN-2: "Is this a single-vineyard offering?" toggle plus, when Yes, a
 * free-text name field with non-binding typeahead suggestions (VIN-5).
 * Plain controlled props (not react-hook-form's Control) so this is
 * reusable as-is by both the grapes form and the bulk-wine form (Phase 5).
 * The caller keeps whatever was typed in its own form state when toggled
 * to No, so toggling back restores it -- only the server decides whether
 * to actually store it (VIN-2).
 */
export function VineyardField({ singleVineyard, onSingleVineyardChange, vineyardName, onVineyardNameChange, error }: VineyardFieldProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Is this a single-vineyard offering?</Label>
        <div className="grid max-w-xs grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSingleVineyardChange(false)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              !singleVineyard
                ? "border-[var(--color-brand)] bg-[var(--color-brand-50)] text-[var(--color-brand-dark)]"
                : "border-stone-300 text-stone-700"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => onSingleVineyardChange(true)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              singleVineyard
                ? "border-[var(--color-brand)] bg-[var(--color-brand-50)] text-[var(--color-brand-dark)]"
                : "border-stone-300 text-stone-700"
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      {singleVineyard && (
        <div className="space-y-1.5">
          <Label htmlFor="vineyard_name">Vineyard Name</Label>
          <VineyardNameInput id="vineyard_name" value={vineyardName} onChange={onVineyardNameChange} />
          {error ? <p className="text-xs text-red-600">{error}</p> : <p className="text-xs text-stone-500">{VINEYARD_NAME_HELPER}</p>}
        </div>
      )}
    </div>
  );
}

function VineyardNameInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const currentRequest = ++requestId.current;
    const timeout = setTimeout(async () => {
      const result = await getVineyardNameSuggestions(trimmed);
      if (requestId.current !== currentRequest) return;
      setSuggestions(result);
      setOpen(result.length > 0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="e.g. To Kalon"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => {
                  onChange(suggestion);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                <MapPinned className="size-3.5 shrink-0 text-stone-500" />
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
