import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid commercial email address." }),
  password: z.string().min(8, { message: "Security standard requires minimum 8 characters." }),
  companyName: z.string().min(2, { message: "Registered entity name is required." }),
  role: z.enum(["grower", "buyer"], { message: "Must define a primary marketplace intent." }),
  regionAva: z.string().min(2, { message: "Specify operational AVA region." }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
