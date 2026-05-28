import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function ordinal(n: number): string {
  if (n === 1) return "🥇 1°";
  if (n === 2) return "🥈 2°";
  if (n === 3) return "🥉 3°";
  return `${n}°`;
}
