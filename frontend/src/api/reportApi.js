import { query, request } from './core.js'

export function listReports(params = {}) {
  return request(`/reports${query(params)}`)
}

export function createReport(body) {
  return request('/reports', { method: 'POST', body })
}
