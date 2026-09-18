import { z } from "zod";

export const CreateCropPlanSchema = z.object({
  variety: z.string().min(2, { message: "Variety is required." }),
  block_identifier: z.string().optional(),
  projected_tons: z.coerce.number().positive({ message: "Enter a projected yield greater than 0." }),
  harvest_year: z.coerce.number().int().min(2020).max(2100),
  current_status: z.enum(["dormant", "flowering", "veraison", "harvested"]).default("dormant"),
  notes: z.string().optional(),
});

export type CreateCropPlanInput = z.input<typeof CreateCropPlanSchema>;
