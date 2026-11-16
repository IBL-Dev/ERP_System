type ClassValue = string | false | null | undefined;

/** Tiny className joiner (swap for clsx + tailwind-merge later if you like). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
