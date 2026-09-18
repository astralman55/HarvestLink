import { z } from "zod";
import { EMAIL_PATTERN, URL_PATTERN } from "@/lib/validation/nda-guard";

// VIN-4: Unicode letters/numbers, spaces, and a specific punctuation set.
// The allowlist alone already structurally blocks HTML tags (no </>/) and
// most emails (no @), but not a bare "www.something" string, so URL_PATTERN
// is checked separately too.
export const VINEYARD_NAME_PATTERN = /^[\p{L}\p{N} '.,\-&()#/]+$/u;

export const VINEYARD_NAME_HELPER = "Type the vineyard name as you'd like buyers to see it.";

export const VineyardNameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, { message: "Vineyard name must be at least 2 characters." })
      .max(100, { message: "Vineyard name must be at most 100 characters." })
      .regex(VINEYARD_NAME_PATTERN, {
        message: "Use letters, numbers, spaces, and ' . , - & ( ) # / only.",
      })
      .refine((value) => !EMAIL_PATTERN.test(value), { message: "Email addresses aren't allowed here." })
      .refine((value) => !URL_PATTERN.test(value), { message: "Links/URLs aren't allowed here." })
  );
