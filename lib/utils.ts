import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string" && value.startsWith("[")) {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (Array.isArray(value)) return value as T;
  return fallback;
}
