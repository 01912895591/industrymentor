/**
 * Formats course, article, and content titles for user-facing display.
 * Converts raw URL-slug or hyphenated titles into proper Title Case.
 * Preserves clean existing titles.
 * NOTE: This only affects visible text; URLs and routing slugs remain unchanged.
 */
export function formatCourseTitle(title: string | null | undefined): string {
  if (!title) return "";

  const trimmed = title.trim();

  // Explicit mapping for specific course title requested by user
  if (
    trimmed === "Garments Merchandising-from-order-to-shipment-excellence" ||
    trimmed.toLowerCase() === "garments merchandising-from-order-to-shipment-excellence" ||
    trimmed.toLowerCase() === "garments-merchandising-from-order-to-shipment-excellence" ||
    trimmed === "Garments Merchandising - From Order to Shipment Excellence"
  ) {
    return "Garments Merchandising: From Order to Shipment Excellence";
  }

  // Handle other slug-like formats: "word1-word2-word3" or "Prefix-slug-format"
  if (trimmed.includes("-") && /[a-z]/.test(trimmed)) {
    // If it's already cleanly formatted with spaces (e.g. "Certified Elite-Performing Executive")
    if (trimmed.includes(" ") && !trimmed.includes("-from-") && !trimmed.includes("-to-")) {
      return trimmed;
    }
    // Convert hyphenated slug words to title case
    const words = trimmed.split(/[-_]/);
    return words
      .filter(Boolean)
      .map((w) => {
        const lower = w.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  return trimmed;
}
