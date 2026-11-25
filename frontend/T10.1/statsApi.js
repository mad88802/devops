/**
 * T10.1 — Statistics API client methods.
 *
 * `src/api/client.js` exposes this object as `api.stats`. T10.2/T10.3 pass
 * `{ weeks, companyId }` through these methods.
 */
import { query, request } from '../src/api/core.js'

export const statsApi = {
  summary(params) {
    return request(`/stats/summary${query(params)}`)
  },
  weekly(weeks = 9, params = {}) {
    return request(`/stats/weekly${query({ weeks, ...params })}`)
  },
  companies(params) {
    return request(`/stats/companies${query(params)}`)
  },
  rules(params) {
    return request(`/stats/rules${query(params)}`)
  },
  activity(limit = 8, params = {}) {
    return request(`/stats/activity${query({ limit, ...params })}`)
  },
}
