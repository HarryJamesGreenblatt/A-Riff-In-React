// Utility function for class name merging
// This simulates the functionality provided by clsx and tailwind-merge

/**
 * Merges multiple class name strings into a single string,
 * removing duplicates and handling conditional classes
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
