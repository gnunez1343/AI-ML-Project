/**
 * Minimal class-name utility — avoids a clsx/tailwind-merge dependency
 * for the scaffold. Replace with clsx + tailwind-merge when needed.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
