import { z } from "zod";
import { GRAPE_VARIETIES, REGION_NAMES } from "@/lib/constants/viticulture";
import { EMAIL_PATTERN, URL_PATTERN } from "@/lib/validation/nda-guard";
import { matcher } from "@/lib/profanity";

export const WANTED_TYPES = ["grapes", "bulk_wine"] as const;
export type WantedType = (typeof WANTED_TYPES)[number];

export const WANTED_PRACTICES = ["conventional", "sustainable", "organic", "biodynamic"] as const;

export const WANTED_NOTES_MAX = 500;
export const WANTED_MAX_OPEN = 10;
export const WANTED_LIFETIME_DAYS = 60;
export const WANTED_MAX_REGIONS = 5;

export const wantedUnit = (type: WantedType) => (type === "bulk_wine" ? "gallons" : "tons");
export const wantedPriceUnit = (type: WantedType) => (type === "bulk_wine" ? "gallon" : "ton");

const optionalNumber = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : Number(value)),
    z.number().positive().max(max).nullable()
  );

export const WantedInputSchema = z
  .object({
    request_type: z.enum(WANTED_TYPES),
    variety: z.string().refine((value) => GRAPE_VARIETIES.includes(value), { message: "Choose a variety from the list." }),
    regions: z
      .array(z.string().refine((value) => REGION_NAMES.includes(value), { message: "Choose regions from the list." }))
      .max(WANTED_MAX_REGIONS, { message: `Choose up to ${WANTED_MAX_REGIONS} regions.` }),
    quantity_min: z.preprocess((value) => Number(value), z.number({ message: "Enter a quantity." }).positive({ message: "Enter a quantity." }).max(1_000_000)),
    quantity_max: optionalNumber(1_000_000),
    max_price: optionalNumber(1_000_000),
    show_price: z.boolean(),
    year: z.preprocess(
      (value) => (value === "" || value == null ? null : Number(value)),
      z.number().int().min(2000).max(2100).nullable()
    ),
    farming_practice: z.enum(WANTED_PRACTICES).nullable(),
    notes: z.string().max(WANTED_NOTES_MAX, { message: `Keep the note under ${WANTED_NOTES_MAX} characters.` }),
    is_anonymous: z.boolean(),
    alert_me: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.quantity_max != null && value.quantity_max < value.quantity_min) {
      ctx.addIssue({ code: "custom", path: ["quantity_max"], message: "The maximum can't be below the minimum." });
    }
  });

export type WantedInput = z.infer<typeof WantedInputSchema>;

const PHONE_PATTERN = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * The note is free text shown to everyone, so it may not carry contact details
 * (everything is arranged through the site's messages) or, on an anonymous
 * request, anything that names the poster.
 */
export function checkWantedNotes(
  notes: string,
  poster: { anonymous: boolean; companyName?: string | null; fullName?: string | null; username?: string | null }
): { blocked: boolean; reason?: string } {
  const text = notes.trim();
  if (!text) return { blocked: false };
  if (EMAIL_PATTERN.test(text)) return { blocked: true, reason: "Remove the email address. Sellers reply to you through the site." };
  if (URL_PATTERN.test(text)) return { blocked: true, reason: "Remove the website or link. Sellers reply to you through the site." };
  if (PHONE_PATTERN.test(text)) return { blocked: true, reason: "Remove the phone number. Sellers reply to you through the site." };
  if (matcher.hasMatch(text)) return { blocked: true, reason: "Please remove the offensive language." };

  if (poster.anonymous) {
    const normalizedText = normalize(text);
    for (const candidate of [poster.companyName, poster.fullName, poster.username]) {
      if (!candidate || candidate.trim().length < 2) continue;
      const normalizedCandidate = normalize(candidate);
      if (normalizedCandidate.length > 1 && normalizedText.includes(normalizedCandidate)) {
        return { blocked: true, reason: `This request is anonymous, so the note can't mention your name or company ("${candidate}").` };
      }
    }
  }
  return { blocked: false };
}

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatQuantityRange(type: WantedType, min: number, max: number | null): string {
  const unit = wantedUnit(type);
  if (max != null && max > min) return `${number.format(min)} to ${number.format(max)} ${unit}`;
  if (max != null && max === min) return `${number.format(min)} ${unit}`;
  return `${number.format(min)}+ ${unit}`;
}

/** Built only from controlled fields, never from the note, so it can never carry identity. */
export function wantedTitle(row: {
  request_type: WantedType;
  variety: string;
  regions: string[];
  quantity_min: number;
  quantity_max: number | null;
  year: number | null;
}): string {
  const what = row.request_type === "bulk_wine" ? `${row.variety} bulk wine` : `${row.variety} grapes`;
  const year = row.year ? `, ${row.year} ${row.request_type === "bulk_wine" ? "vintage" : "harvest"}` : "";
  const where =
    row.regions.length === 0
      ? ""
      : row.regions.length <= 2
        ? ` from ${row.regions.join(" or ")}`
        : ` from ${row.regions[0]} and ${row.regions.length - 1} other regions`;
  return `Wanted: ${formatQuantityRange(row.request_type, Number(row.quantity_min), row.quantity_max == null ? null : Number(row.quantity_max))} of ${what}${year}${where}`;
}

/** A saved-search query string that matches a request, so a buyer is alerted to matching lots. */
export function wantedSearchQueries(input: Pick<WantedInput, "variety" | "regions" | "year" | "request_type" | "max_price" | "farming_practice">): string[] {
  const build = (region?: string) => {
    const params = new URLSearchParams();
    params.set("variety", input.variety);
    if (region) params.set("region_ava", region);
    if (input.year) params.set(input.request_type === "bulk_wine" ? "vintage_year" : "harvest_year", String(input.year));
    if (input.max_price) params.set("max_price", String(input.max_price));
    return params.toString();
  };
  // A saved search holds one region, so several regions become several searches.
  if (input.regions.length === 0) return [build()];
  return input.regions.slice(0, 3).map((region) => build(region));
}
