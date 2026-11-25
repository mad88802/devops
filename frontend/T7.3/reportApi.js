/**
 * T7.3 — Report API methods.
 *
 * The generic fetch wrapper lives in `src/api/core.js`; these are the
 * report-specific calls used by the report dialog and the result page.
 */
import { query, request } from '../src/api/core.js'

export function listReports(params = {}) {
  return request(`/reports${query(params)}`)
}

export function createReport(body) {
  return request('/reports', { method: 'POST', body })
}
