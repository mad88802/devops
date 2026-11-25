/**
 * T7.2 — Parse the `status` query parameter.
 *
 * Accepts a single code or a comma-separated list, case-insensitively, and
 * ignores unknown values. Used by `server/store.js#listPostings`.
 */
import { STATUS_ORDER } from './statusMeta.js'

export function parseStatusFilter(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter((code) => STATUS_ORDER.includes(code))
}
