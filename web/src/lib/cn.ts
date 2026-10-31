type ClassValue = string | false | null | undefined

/** Joins class names, skipping falsy values. (No conflict resolution: avoid passing clashing utilities.) */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
