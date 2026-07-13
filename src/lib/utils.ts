import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

export function estimateNumber(seq: number) {
  const y = new Date().getFullYear();
  return `EST-${y}-${String(seq).padStart(3, "0")}`;
}
