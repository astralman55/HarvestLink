import { z } from "zod";

/**
 * Length of the emailed confirmation code. Must match Supabase Dashboard ->
 * Authentication -> Providers -> Email -> "Email OTP Length" (this project
 * was created with 8; 6 is the more familiar length). It only controls
 * auto-submit and the placeholder -- the server accepts any 6-10 digit code,
 * so a mismatch never locks anyone out.
 */
export const OTP_LENGTH = Number(process.env.NEXT_PUBLIC_OTP_LENGTH) || 6;

/** Seconds a user must wait before asking for another code (Supabase enforces 60s server-side). */
export const RESEND_COOLDOWN_SECONDS = 60;

const CODE_PATTERN = /^\d{6,10}$/;

export const VerifyCodeSchema = z.object({
  email: z.string().trim().email(),
  // Users paste codes with spaces ("1234 5678") or from autofill; normalize first.
  code: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(z.string().regex(CODE_PATTERN)),
});

/** Strips everything that isn't a digit and caps the length, for the code input. */
export function sanitizeCodeInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/**
 * Only same-site relative paths may be used as a post-login destination, so
 * a crafted `?redirect_to=https://evil.example` or `//evil.example` link can
 * never bounce a freshly signed-in user off-site.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
