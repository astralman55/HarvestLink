"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
 * VIN-2: "Is this a single-vineyard offering?" checkbox plus, when checked,
 * a free-text name field with non-binding typeahead suggestions (VIN-5),
 * grouped in one bordered "vineyard detail" box. Plain controlled props
 * (not react-hook-form's Control) so this is reusable as-is by both the
 * grapes form and the bulk-wine form (Phase 5). The caller keeps whatever
 * was typed in its own form state when unchecked, so re-checking restores
 * it -- only the server decides whether to actually store it (VIN-2).
 */
export function VineyardField({ singleVineyard, onSingleVineyardChange, vineyardName, onVineyardNameChange, error }: VineyardFieldProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <label htmlFor="single_vineyard" className="flex cursor-pointer items-center gap-2.5">
        <Checkbox
          id="single_vineyard"
          checked={singleVineyard}
          onCheckedChange={(checked) => onSingleVineyardChange(checked === true)}
        />
        <span className="text-sm font-medium text-stone-900">Is this a single-vineyard offering?</span>
      </label>

      {singleVineyard && (
        <div className="mt-3 space-y-1.5 border-t border-stone-200 pt-3">
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
