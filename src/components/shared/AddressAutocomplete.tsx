"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Type-ahead address field. Uses Google Places Autocomplete when
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set (the same widget most checkout
 * flows use); otherwise falls back to OpenStreetMap's free Nominatim
 * search so the field still works with zero configuration.
 */
export function AddressAutocomplete(props: AddressAutocompleteProps) {
  if (GOOGLE_MAPS_API_KEY) {
    return <GoogleAddressAutocomplete {...props} apiKey={GOOGLE_MAPS_API_KEY} />;
  }
  return <NominatimAddressAutocomplete {...props} />;
}

// ---------------------------------------------------------------------
// Google Places Autocomplete
// ---------------------------------------------------------------------

let googleMapsLoadPromise: Promise<void> | null = null;

/**
 * Loads the Maps JS API using the classic `callback=` query param, which
 * only fires once every requested library (here, `places`) has fully
 * finished initializing — unlike the newer `loading=async` flag, which
 * resolves the script's own onload before the `places` sub-bundle is
 * necessarily ready, leaving `Autocomplete` constructible but silently
 * never issuing predictions requests.
 */
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window !== "undefined" && window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }
  if (!googleMapsLoadPromise) {
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const callbackName = "__gmapsAutocompleteReady";
      (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.onerror = () => reject(new Error("Failed to load Google Maps JS API"));
      document.head.appendChild(script);
    });
  }
  return googleMapsLoadPromise;
}

function GoogleAddressAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  apiKey,
}: AddressAutocompleteProps & { apiKey: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!inputRef.current) return;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current) return;
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["formatted_address"],
        });
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) onChange(place.formatted_address);
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
    // Attach once; the field stays uncontrolled after that (Google's
    // widget writes directly into the DOM input on selection).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  if (failed) {
    return <NominatimAddressAutocomplete id={id} value={value} onChange={onChange} placeholder={placeholder} />;
  }

  return (
    <Input
      ref={inputRef}
      id={id}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}

// ---------------------------------------------------------------------
// Nominatim fallback (no API key required)
// ---------------------------------------------------------------------

interface NominatimSuggestion {
  display_name: string;
}

function NominatimAddressAutocomplete({ id, value, onChange, placeholder }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&countrycodes=us&q=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data: NominatimSuggestion[] = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch {
        // Ignore aborted or failed lookups — the field still works as a
        // plain text input if the autocomplete service is unreachable.
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
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
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.display_name}>
              <button
                type="button"
                onClick={() => {
                  onChange(suggestion.display_name);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3.5 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-stone-400" />
                {suggestion.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
