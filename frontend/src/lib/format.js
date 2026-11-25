/**
 * Display helpers.
 *
 * T5.2 — fieldLabel / conditionValue (rule explanation)
 * T5.3 — statusTone / statusLabel (badges and verdict colours)
 * T7.1 — relativeDays / percent (list columns)
 */
import { FIELD_INDEX, STATUS_META, riskBand } from '../../shared/fields.js'

export { riskBand }

export const STATUS_TONE = {
  P: 'pending',
  L: 'legit',
  S: 'suspicious',
  F: 'fake',
}

export function statusTone(status) {
  return STATUS_TONE[status] ?? 'pending'
}

export function statusLabel(status, t) {
  return t(STATUS_META[status]?.label ?? 'status.P')
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** 'Lina Haddad' -> 'LH' */
export function initials(...parts) {
  const words = parts
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Human label for a rule condition field, e.g. 'content.contactChannel'. */
export function fieldLabel(fieldKey, t) {
  if (FIELD_INDEX[fieldKey]) return t(FIELD_INDEX[fieldKey].label)
  return t(`field.${fieldKey}`)
}

/** Render an expected value in a rule condition. */
export function conditionValue(fieldKey, value, t) {
  if (fieldKey === 'posting.status') return value
  if (typeof value === 'boolean') return value ? '1' : '0'
  return String(value)
}

/** Short relative date used in tables. */
export function relativeDays(days, t) {
  if (days === null || days === undefined) return '—'
  if (days <= 0) return t('common.today')
  return t('common.daysAgo', { count: days })
}

export function formatSalary(salary, t) {
  if (!salary) return '—'
  if (Number(salary.salaryHidden) === 1) return t('browse.salaryHidden')
  if (salary.salaryMin == null && salary.salaryMax == null) return t('browse.salaryHidden')
  const fmt = (n) =>
    n == null ? '—' : new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
  return `${fmt(salary.salaryMin)}–${fmt(salary.salaryMax)} ${salary.currency ?? ''}`.trim()
}

/** Percent string with a fixed decimal only when it helps. */
export function percent(value) {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}
