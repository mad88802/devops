/**
 * T4.3 — Posting API methods used by the form.
 *
 * The generic fetch wrapper lives in `src/api/core.js`; `src/api/client.js`
 * exposes these as `api.postings.create` and `api.postings.check`.
 */
import { request } from '../src/api/core.js'

export function createPosting(body) {
  return request('/postings', { method: 'POST', body })
}

export function checkPosting(id, recruiterId) {
  return request(`/postings/${id}/check`, { method: 'POST', body: { recruiterId } })
}
