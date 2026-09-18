"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema, type LoginInput } from "@/lib/validation/auth";

export async function handleSignIn(formData: LoginInput) {
  const validation = LoginSchema.safeParse(formData);
  if (!validation.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to enable sign in.",
    };
  }
}
