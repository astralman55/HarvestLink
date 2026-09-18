"use server";

import { createClient } from "@/lib/supabase/server";
import { RegisterSchema, type RegisterInput } from "@/lib/validation/auth";

export async function handleSignUp(formData: RegisterInput) {
  const validation = RegisterSchema.safeParse(formData);
  if (!validation.success) {
    return { error: "Data manipulation vector rejected by validation schema." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          company_name: formData.companyName || null,
          full_name: formData.fullName || null,
          role: formData.role,
          region_ava: formData.regionAva || null,
          address: formData.address || null,
        },
      },
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to enable sign up.",
    };
  }
}
