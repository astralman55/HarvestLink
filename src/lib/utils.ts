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
