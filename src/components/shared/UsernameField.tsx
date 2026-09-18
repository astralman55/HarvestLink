"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { USERNAME_RULES_HELPER } from "@/lib/validation/username";
import { checkUsernameAvailability } from "@/app/(auth)/username-actions";

interface UsernameFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Surfaces the live availability verdict so the parent form can block submit on it too. */
  onAvailabilityChange?: (available: boolean | null) => void;
  helperText?: string;
  autoFocus?: boolean;
}

type CheckState = "idle" | "checking" | "available" | "unavailable";

/**
 * USR-1: live rules + a debounced availability check (Available/Already
 * taken) without requiring form submit. Shared by the signup form and the
 * "choose your username" migration step (USR-7) so both get identical
 * behavior from one place.
 */
export function UsernameField({ id = "username", value, onChange, onAvailabilityChange, helperText, autoFocus }: UsernameFieldProps) {
  const [state, setState] = useState<CheckState>("idle");
  const [reason, setReason] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setState("idle");
      setReason(null);
      onAvailabilityChange?.(null);
      return;
    }

    setState("checking");
    const currentRequest = ++requestId.current;
    const timeout = setTimeout(async () => {
      const result = await checkUsernameAvailability(trimmed);
      if (requestId.current !== currentRequest) return; // a newer keystroke superseded this check
      setState(result.available ? "available" : "unavailable");
      setReason(result.available ? null : result.reason);
      onAvailabilityChange?.(result.available);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="grapeguy"
          autoComplete="username"
          autoFocus={autoFocus}
          className="pr-9"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {state === "checking" && <Loader2 className="size-4 animate-spin text-stone-500" />}
          {state === "available" && <Check className="size-4 text-emerald-600" />}
          {state === "unavailable" && <X className="size-4 text-red-500" />}
        </span>
      </div>
      {state === "unavailable" && reason ? (
        <p className="text-xs text-red-600">{reason}</p>
      ) : state === "available" ? (
        <p className="text-xs text-emerald-600">Available</p>
      ) : (
        <p className="text-xs text-stone-500">{helperText ?? USERNAME_RULES_HELPER}</p>
      )}
    </div>
  );
}
