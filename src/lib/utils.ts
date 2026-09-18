import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTons(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)} tons`;
}

// WINE-4: price/gal can be as low as $0.01, where formatCurrency's
// whole-dollar rounding would print "$0". Bulk wine money fields use this
// instead.
export function formatCurrencyPrecise(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatGallons(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} gal`;
}

// WINE-4: "Total lot value... computed with exact decimal math... never
// floating point." Cents-based integer arithmetic avoids the float
// rounding errors that quantity * price could otherwise introduce.
export function computeTotalLotValue(quantityGallons: number, pricePerGallon: number): number {
  const priceCents = Math.round(pricePerGallon * 100);
  const totalCents = Math.round(quantityGallons) * priceCents;
  return totalCents / 100;
}

// WINE-2: "/grapes/{slug}-{id}" and "/bulk-wine/{slug}-{id}" -- no slug
// generation existed anywhere in the app before this (Phase 0 audit); the
// slug is cosmetic/SEO-only, the id suffix is always the real lookup key.
const UUID_LENGTH = 36;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildListingSlugPath(title: string, id: string): string {
  const slug = slugify(title);
  return slug ? `${slug}-${id}` : id;
}

/**
 * UUIDs are always exactly 36 characters, so the last 36 characters of a
 * "{slug}-{id}" path segment are unambiguously the id even though the slug
 * portion may itself contain hyphens. Falls back to the raw param
 * (demo listing ids like "demo-1", or a bare id typed with no slug at
 * all) when that's not a UUID. Demo-mode ids (DEMO_LISTINGS, used when no
 * real Supabase project is reachable) are a second known shape ("demo-1"
 * etc.) and are matched explicitly too, since they don't have a fixed
 * length to anchor on the way UUIDs do. Anything else falls back to the
 * raw param -- getListingById()'s own not-found handling takes it from
 * there.
 */
const DEMO_ID_PATTERN = /demo-\d+$/;

export function parseListingIdFromSlugParam(param: string): string {
  if (param.length >= UUID_LENGTH) {
    const candidate = param.slice(-UUID_LENGTH);
    if (UUID_PATTERN.test(candidate)) return candidate;
  }
  const demoMatch = param.match(DEMO_ID_PATTERN);
  if (demoMatch) return demoMatch[0];
  return param;
}

export function generateListingTitle(
  variety: string | undefined,
  clone: string | undefined,
  regionAva: string | undefined
) {
  if (!variety && !regionAva) return "";
  const varietyPart = clone ? `${variety} (${clone})` : variety;
  if (varietyPart && regionAva) return `${varietyPart} — ${regionAva}`;
  return varietyPart || regionAva || "";
}

// WINE-4: shared fields (title, varietal, description...) reuse the same
// components as grapes; bulk wine's title swaps tonnage/clone framing for
// vintage framing since clone isn't a bulk-wine-specific field.
export function generateBulkWineTitle(
  variety: string | undefined,
  vintageYear: number | undefined,
  isMultiVintage: boolean | undefined,
  regionAva: string | undefined
) {
  if (!variety && !regionAva) return "";
  const vintagePart = isMultiVintage ? "NV" : vintageYear ? String(vintageYear) : undefined;
  const varietyPart = vintagePart ? `${vintagePart} ${variety}` : variety;
  if (varietyPart && regionAva) return `${varietyPart} Bulk Wine — ${regionAva}`;
  return varietyPart ? `${varietyPart} Bulk Wine` : regionAva || "";
}
