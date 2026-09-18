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
