import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend's own sandbox sender -- works with no domain setup, but only
// delivers to the email address on the Resend account itself. Swap
// RESEND_FROM_EMAIL to something on a verified domain to notify real
// buyers/sellers; no code change needed, just the env var.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "HarvestLink <onboarding@resend.dev>";

/**
 * Best-effort email send -- a failure here must never surface as an error
 * to the caller or block the thing that triggered it (an inquiry message
 * has already been saved by the time this runs). Silently no-ops if
 * RESEND_API_KEY isn't configured, so this is safe to call in every
 * environment, including local dev with no key set.
 *
 * Returns true only when Resend accepted the message, so callers that need
 * to know (the saved-search digest only advances its "last checked" time
 * after a successful send) can tell; the inquiry notifications ignore it.
 */
export async function sendNotificationEmail({
  to,
  subject,
  text,
  html,
  headers,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
}): Promise<boolean> {
  if (!resend) return false;
  try {
    // The Resend SDK reports a rejected send (bad address, over quota, etc.)
    // as `{ error }` in its return value, not a thrown exception -- has to
    // be checked explicitly, or a real misconfiguration (e.g. a rotated,
    // now-invalid API key) would fail completely silently forever.
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, text, ...(html ? { html } : {}), ...(headers ? { headers } : {}) });
    if (error) {
      console.error("Resend rejected a notification email:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend send threw:", err);
    return false;
  }
}
