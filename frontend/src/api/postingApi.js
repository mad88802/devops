import { query, request } from './core.js'

export function createPosting(body) {
  return request('/postings', { method: 'POST', body })
}

export function checkPosting(id, recruiterId) {
  return request(`/postings/${id}/check`, { method: 'POST', body: { recruiterId } })
}

export function listPostings(params = {}) {
  return request(`/postings${query(params)}`)
}
