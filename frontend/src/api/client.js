/**
 * API facade.
 *
 * The generic fetch wrapper, query builder and `ApiError` live in `./core.js`.
 * Each task contributes its own methods and they are assembled here so pages
 * keep a single `api` object:
 *
 *   T4.3  postings.create / postings.check .... T4.3/postingApi.js
 *   T7.1  postings.list ....................... T7.1/postingListApi.js
 *   T7.2  postings.list({ status }) ........... status query parameter
 *   T7.3  reports.create / reports.list ....... T7.3/reportApi.js
 *   T10.1 stats.summary / weekly / companies /
 *         rules / activity .................... T10.1/statsApi.js
 *
 * The bundled mock API is reached through the Vite proxy by default. Set
 * VITE_API_BASE_URL to another back-end and every screen keeps working as long
 * as the routes in README.md#6-api-surface are implemented.
 */

import { ApiError, BASE, query, request } from './core.js'
import { createPosting, checkPosting } from '../../T4.3/postingApi.js'
import { listPostings } from '../../T7.1/postingListApi.js'
import { createReport, listReports } from '../../T7.3/reportApi.js'
import { statsApi } from '../../T10.1/statsApi.js'

export { ApiError }

export const api = {
  baseUrl: BASE,

  /** `{ email, password }` for a real account, `{ role }` for a demo shortcut. */
  login(credentials = {}) {
    return request('/auth/login', { method: 'POST', body: credentials })
  },
  register(body) {
    return request('/auth/register', { method: 'POST', body })
  },
  accounts() {
    return request('/auth/accounts')
  },

  companies: {
    list(params) {
      return request(`/companies${query(params)}`)
    },
    get(id) {
      return request(`/companies/${id}`)
    },
    create(body) {
      return request('/companies', { method: 'POST', body })
    },
    update(id, body) {
      return request(`/companies/${id}`, { method: 'PUT', body })
    },
    remove(id, { force = false } = {}) {
      return request(`/companies/${id}${force ? '?force=1' : ''}`, { method: 'DELETE' })
    },
    check(id) {
      return request(`/companies/${id}/check`, { method: 'POST' })
    },
    setBlacklist(id, blacklisted) {
      return request(`/companies/${id}/blacklist`, { method: 'POST', body: { blacklisted } })
    },
  },

  postings: {
    // T7.1 search/pagination + T7.2 status filter are query parameters.
    list: listPostings,
    get(id) {
      return request(`/postings/${id}`)
    },
    // T4.3 — form save/check methods live in T4.3/postingApi.js.
    create: createPosting,
    update(id, body) {
      return request(`/postings/${id}`, { method: 'PUT', body })
    },
    remove(id) {
      return request(`/postings/${id}`, { method: 'DELETE' })
    },
    check: checkPosting,
    override(id, body) {
      return request(`/postings/${id}/override`, { method: 'POST', body })
    },
    history(id) {
      return request(`/postings/${id}/history`)
    },
  },

  reports: {
    // T7.3 — report API methods live in T7.3/reportApi.js.
    list: listReports,
    create: createReport,
  },

  recruiters: {
    list() {
      return request('/recruiters')
    },
    create(body) {
      return request('/recruiters', { method: 'POST', body })
    },
    update(id, body) {
      return request(`/recruiters/${id}`, { method: 'PUT', body })
    },
    remove(id) {
      return request(`/recruiters/${id}`, { method: 'DELETE' })
    },
  },

  candidates: {
    list() {
      return request('/candidates')
    },
  },

  classifications(limit = 20) {
    return request(`/classifications${query({ limit })}`)
  },

  /*
   * T10.1 — statistics API methods live in T10.1/statsApi.js.
   * T10.3 — every method takes optional params `{ weeks, companyId }`.
   */
  stats: statsApi,

  rules() {
    return request('/rules')
  },

  resetDemoData() {
    return request('/dev/reset', { method: 'POST' })
  },
}
