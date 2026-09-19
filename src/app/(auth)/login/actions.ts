"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LoginSchema, type LoginInput } from "@/lib/validation/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { flags } from "@/lib/flags";

const GENERIC_ERROR = "Incorrect email/username or password.";
// Used only to keep the sign-in call's timing similar whether or not the
// identifier resolves, so a failed username lookup isn't distinguishable
// from a wrong password by response time alone.
const DUMMY_EMAIL = "no-such-account@harvestlink.invalid";

async function resolveEmail(identifier: string): Promise<string> {
  if (!flags.usernames || identifier.includes("@")) return identifier;

  try {
    const admin = createAdminClient();
    const { data } = await admin.rpc("get_email_for_login", { p_identifier: identifier });
    return typeof data === "string" && data ? data : DUMMY_EMAIL;
  } catch {
    return DUMMY_EMAIL;
  }
}

export async function handleSignIn(formData: LoginInput) {
  const validation = LoginSchema.safeParse(formData);
  if (!validation.success) {
    return { error: "Enter your email or username, and your password." };
  }

  const { allowed } = await checkRateLimit("login", { limit: 8, windowMs: 60_000 });
  if (!allowed) {
    return { error: "Too many attempts. Please wait a moment and try again." };
  }

  try {
    const supabase = await createClient();
    const email = await resolveEmail(formData.identifier.trim());

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: formData.password,
    });
    if (error) {
      // Supabase only reports "not confirmed" once the password was correct
      // (a wrong password gets invalid_credentials), so this doesn't reveal
      // anything to someone guessing. Send a fresh code -- the one from
      // signup may have expired -- and hand off to the verify screen.
      if (error.code === "email_not_confirmed") {
        await supabase.auth.resend({ type: "signup", email });
        return { needsVerification: true as const, email };
      }
      return { error: GENERIC_ERROR };
    }

    if (!flags.usernames) return { success: true, needsUsername: false };

    // USR-7: existing accounts with no username yet get a one-time
    // blocking prompt before continuing to wherever they were headed.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user!.id).single();

    return { success: true, needsUsername: !profile?.username };
  } catch {
    return {
      error:
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to enable sign in.",
    };
  }
}
