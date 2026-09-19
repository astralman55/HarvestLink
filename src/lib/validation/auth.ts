import { z } from "zod";
import { UsernameSchema } from "@/lib/validation/username";
import { flags } from "@/lib/flags";

// USR-5 (SHOULD): 10-12+ minimum, allow long passphrases, no forced
// composition rules. Breach-list checking (HIBP) happens server-side in
// the register action, since it needs a network call.
export const PasswordSchema = z
  .string()
  .min(10, { message: "Use at least 10 characters." })
  .max(128, { message: "That's a bit long -- 128 characters max." });

export const RegisterSchema = z
  .object({
    email: z.string().email({ message: "Invalid commercial email address." }),
    // Optional at the object level and enforced in superRefine below so
    // this can be feature-flagged dark (docs/scope-addendum-decisions.md,
    // Decision 4) without two parallel schemas.
    username: z.string().optional(),
    password: PasswordSchema,
    role: z.enum(["grower", "buyer"], { message: "Must define a primary marketplace intent." }),
    // Growers: company + operational AVA region. Buyers: name, company
    // optional. (No street address is collected at signup.) Cross-field requirements enforced below since
    // which fields are required depends on `role`.
    fullName: z.string().optional(),
    companyName: z.string().optional(),
    regionAva: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (flags.usernames) {
      const usernameCheck = UsernameSchema.safeParse(data.username ?? "");
      if (!usernameCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["username"],
          message: usernameCheck.error.issues[0]?.message ?? "Invalid username.",
        });
      }
    }
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
    }
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

// USR-6: login accepts email OR username in one field.
export const LoginSchema = z.object({
  identifier: z.string().min(1, { message: "Enter your email or username." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// USR-7: the blocking "choose your username" step for pre-existing accounts.
export const ChooseUsernameSchema = z.object({
  username: UsernameSchema,
});

export type ChooseUsernameInput = z.infer<typeof ChooseUsernameSchema>;
