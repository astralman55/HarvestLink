import { z } from "zod";
import { VineyardNameSchema } from "@/lib/validation/vineyard";
import { US_STATES } from "@/lib/constants/bulk-wine";

const BULK_WINE_FARMING_PRACTICE_VALUES = [
  "organic",
  "biodynamic",
  "natural",
  "sustainable",
  "regenerative_organic",
  "demeter_certified_biodynamic",
] as const;

// WINE-4/WINE-5: shared fields reuse the same components/validation as
// grapes (variety, description, NDA, vineyard, grape origin via
// region_ava/sub_ava); everything below "quantity_gallons" is bulk-wine-
// specific. Wine location (wine_location_state/county) is a separate
// field from grape origin and must never be synced with it (WINE-5).
export const CreateBulkWineListingSchema = z
  .object({
    variety: z.string().min(2),
    region_ava: z.string().min(2, { message: "Select the grape origin (AVA)." }),
    sub_ava: z.string().optional(),
    description: z.string().min(10, { message: "Add at least a short description (10+ characters)." }),
    status: z.enum(["available", "pending", "sold", "archived"]).optional(),
    is_nda: z.boolean().default(false),
    nda_location_precision: z.enum(["county", "state"]).default("county"),
    single_vineyard: z.boolean().default(false),
    vineyard_name: z.string().optional(),

    // WINE-4 bulk-wine-specific fields.
    quantity_gallons: z.coerce
      .number()
      .int({ message: "Whole gallons only." })
      .min(1, { message: "Quantity must be at least 1 gallon." })
      .max(5_000_000, { message: "Quantity must be at most 5,000,000 gallons." }),
    price_per_gallon: z.coerce
      .number()
      .min(0.01, { message: "Price must be at least $0.01/gal." })
      .max(1000, { message: "Price must be at most $1,000/gal." })
      .multipleOf(0.01, { message: "Use at most 2 decimal places." }),
    abv: z.coerce
      .number()
      .min(5, { message: "ABV must be at least 5.0%." })
      .max(25, { message: "ABV must be at most 25.0%." })
      .multipleOf(0.1, { message: "Use at most 1 decimal place." }),
    total_so2_ppm: z.coerce.number().int().min(0).max(1000).optional(),
    vintage_year: z.coerce.number().int().optional(),
    is_multi_vintage: z.boolean().default(false),
    wine_location_state: z.enum(US_STATES, { message: "Select a state." }),
    wine_location_county: z.string().min(2, { message: "Enter a county or region." }).max(100),
    farming_practices: z.array(z.enum(BULK_WINE_FARMING_PRACTICE_VALUES)).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.single_vineyard) {
      const check = VineyardNameSchema.safeParse(data.vineyard_name ?? "");
      if (!check.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["vineyard_name"],
          message: check.error.issues[0]?.message ?? "Enter a vineyard name.",
        });
      }
    }
    // Vintage NV toggle (Appendix A: "Non-vintage / multi-vintage blend").
    if (!data.is_multi_vintage && !data.vintage_year) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vintage_year"], message: "Select a vintage, or mark non-vintage." });
    }
  });

export type CreateBulkWineListingInput = z.input<typeof CreateBulkWineListingSchema>;
