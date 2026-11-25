/**
 * T10.3 — Dashboard filter defaults.
 *
 * Kept in its own module so the filter component and the page wrapper agree on
 * the default period and the options offered.
 */
export const DEFAULT_WEEKS = 9

export const PERIOD_OPTIONS = [4, 9, 13, 26]

/** Build the stats query params from the current filter state. */
export function filterParams(weeks, companyId) {
  return companyId ? { weeks, companyId } : { weeks }
}
