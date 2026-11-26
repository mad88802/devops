/**
 * Consolidated API facade.
 * Reads endpoints from the Flask backend (or mock API).
 */
import { ApiError, BASE, query, request } from './core.js'
import { createPosting, checkPosting, listPostings } from './postingApi.js'
import { createReport, listReports } from './reportApi.js'
import { statsApi } from './statsApi.js'

export { ApiError }

export const api = {
  baseUrl: BASE,

  /** `{ email, password }` for a real account, `{ role }` or `(role, userId)` for a shortcut. */
  login(credentialsOrRole, userId) {
    const body =
      typeof credentialsOrRole === 'object' && credentialsOrRole !== null
        ? credentialsOrRole
        : { role: credentialsOrRole, userId }
    return request('/auth/login', { method: 'POST', body })
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
    list: listPostings,
    get(id) {
      return request(`/postings/${id}`)
    },
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

  stats: statsApi,

  rules() {
    return request('/rules')
  },

  resetDemoData() {
    return request('/dev/reset', { method: 'POST' })
  },
}
