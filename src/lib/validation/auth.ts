import { z } from "zod";

export const RegisterSchema = z
  .object({
    email: z.string().email({ message: "Invalid commercial email address." }),
    password: z.string().min(8, { message: "Security standard requires minimum 8 characters." }),
    role: z.enum(["grower", "buyer"], { message: "Must define a primary marketplace intent." }),
    // Growers: company + operational AVA region. Buyers: name + address,
    // company optional. Cross-field requirements enforced below since
    // which fields are required depends on `role`.
    fullName: z.string().optional(),
    companyName: z.string().optional(),
    regionAva: z.string().optional(),
    address: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "grower") {
      if (!data.companyName || data.companyName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["companyName"],
          message: "Registered entity name is required.",
        });
      }
      if (!data.regionAva || data.regionAva.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["regionAva"],
          message: "Specify operational AVA region.",
        });
      }
    } else {
      if (!data.fullName || data.fullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fullName"],
          message: "Enter your name.",
        });
      }
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Enter your address.",
        });
      }
    }
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
