/**
 * T5.3 — Status badges and risk score display.
 *
 * Coded status and risk metadata shared by the UI and the statistics screens.
 * `shared/fields.js` re-exports these values so existing imports keep working.
 */

export const STATUS_META = {
  P: { code: 'P', label: 'status.P', tone: 'pending', short: 'status.P.short' },
  L: { code: 'L', label: 'status.L', tone: 'legit', short: 'status.L.short' },
  S: { code: 'S', label: 'status.S', tone: 'suspicious', short: 'status.S.short' },
  F: { code: 'F', label: 'status.F', tone: 'fake', short: 'status.F.short' },
}

export const STATUS_ORDER = ['P', 'S', 'L', 'F']

/** Risk band used by the risk ruler and the verdict colours. */
export function riskBand(score) {
  if (score >= 85) return 'critical'
  if (score >= 55) return 'elevated'
  if (score >= 25) return 'watch'
  return 'low'
}
