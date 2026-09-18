import { z } from "zod";

export const CreateListingSchema = z.object({
  variety: z.string().min(2),
  clone: z.string().optional(),
  rootstock: z.string().optional(),
  region_ava: z.string().min(2),
  sub_ava: z.string().optional(),
  estimated_tons: z.coerce.number().positive(),
  minimum_tons: z.coerce.number().positive().default(1),
  price_per_ton: z.coerce.number().positive(),
  brix_target: z.coerce.number().min(10).max(40).optional(),
  description: z.string().min(10, { message: "Add at least a short description (10+ characters)." }),
  farming_practice: z.enum(["conventional", "sustainable", "organic", "biodynamic"]),
  trellis_system: z.string().optional(),
  soil_type: z.string().optional(),
  sun_exposure: z.string().optional(),
  slope_percent: z.coerce.number().min(0).max(100).optional(),
  harvest_year: z.coerce.number().int().min(2020).max(2100),
});

// react-hook-form needs the pre-coercion shape (z.input) since fields like
// estimated_tons start as strings from <input type="number">; the server
// action re-runs safeParse to get the coerced, validated output.
export type CreateListingInput = z.input<typeof CreateListingSchema>;
