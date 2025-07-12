import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Standard currency formatter
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Privacy-aware currency formatter
export function formatCurrencyWithPrivacy(
  amount: number,
  isPrivate: boolean,
): string {
  if (isPrivate) {
    // Preserve the structure but obfuscate the numbers
    const formatted = formatCurrency(amount);
    // Replace digits with dots, keep currency symbol and decimal point
    return formatted.replace(/\d/g, "•");
  }
  return formatCurrency(amount);
}
