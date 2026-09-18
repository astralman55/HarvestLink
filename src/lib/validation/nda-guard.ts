/**
 * NDA-6: free-text leak guard. Titles are server-generated from controlled
 * fields (variety/clone/region -- see docs/scope-addendum-decisions.md,
 * resolution of Phase 0 audit Flag #3) and can't contain identity strings,
 * so only `description` is genuine free text today. This same guard is
 * reused for the description field on both listing types.
 */
export interface FreeTextGuardInput {
  text: string | null | undefined;
  companyName?: string | null;
  fullName?: string | null;
  username?: string | null;
  /** Every vineyard name the seller has used across any of their listings. */
  vineyardNames?: readonly (string | null | undefined)[];
}

export interface FreeTextGuardResult {
  blocked: boolean;
  reason?: string;
}

// Exported for reuse by VIN-4's vineyard-name validation, which also has to
// reject emails/URLs.
export const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
export const URL_PATTERN = /\b((https?:\/\/)|(www\.))\S+/i;
// Matches common phone groupings (US-style 3-3-4, with or without an area
// code in parens, an optional country code, and space/dot/dash separators)
// rather than "any run of digits" -- a plain run would false-positive on
// things like "vintages 1998 1999 2000" in an ordinary description.
const PHONE_PATTERN = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function checkFreeTextForNdaLeak(input: FreeTextGuardInput): FreeTextGuardResult {
  const text = input.text?.trim();
  if (!text) return { blocked: false };

  if (EMAIL_PATTERN.test(text)) {
    return { blocked: true, reason: "Remove the email address -- buyers contact you through the site on NDA listings." };
  }
  if (URL_PATTERN.test(text)) {
    return { blocked: true, reason: "Remove the website/link -- buyers contact you through the site on NDA listings." };
  }
  if (PHONE_PATTERN.test(text)) {
    return { blocked: true, reason: "Remove the phone number -- buyers contact you through the site on NDA listings." };
  }

  const normalizedText = normalize(text);
  const candidates = [input.companyName, input.fullName, input.username, ...(input.vineyardNames ?? [])].filter(
    (value): value is string => !!value && value.trim().length > 1
  );

  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    if (normalizedCandidate.length > 1 && normalizedText.includes(normalizedCandidate)) {
      return {
        blocked: true,
        reason: `Avoid mentioning your winery, vineyard, brand, or anything else that could identify you (found "${candidate}").`,
      };
    }
  }

  return { blocked: false };
}
