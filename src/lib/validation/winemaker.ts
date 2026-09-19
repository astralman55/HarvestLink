import { z } from "zod";
import { EMAIL_PATTERN, URL_PATTERN } from "@/lib/validation/nda-guard";
import { VINEYARD_NAME_PATTERN } from "@/lib/validation/vineyard";

export const WINEMAKER_NAME_HELPER =
  "Who made this wine. If you're selling under NDA, this is hidden from buyers along with your name and vineyard.";

// Same character allowlist and email/URL rejection as a vineyard name -- it's
// free text that ends up on a public page, so it gets the same treatment.
export const WinemakerNameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, { message: "Winemaker name must be at least 2 characters." })
      .max(100, { message: "Winemaker name must be at most 100 characters." })
      .regex(VINEYARD_NAME_PATTERN, {
        message: "Use letters, numbers, spaces, and ' . , - & ( ) # / only.",
      })
      .refine((value) => !EMAIL_PATTERN.test(value), { message: "Email addresses aren't allowed here." })
      .refine((value) => !URL_PATTERN.test(value), { message: "Links/URLs aren't allowed here." })
  );

/** Trimmed winemaker name, or null when the field was left blank. Assumes it already passed validation. */
export function normalizeWinemakerName(value: string | undefined | null): string | null {
  const trimmed = value?.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed : null;
}
