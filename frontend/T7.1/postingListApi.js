/**
 * T7.1 — Posting list API method.
 *
 * `q`, `status`, `sort`, `page` and `limit` are query parameters understood by
 * `GET /api/postings`. `src/api/client.js` exposes this as `api.postings.list`.
 */
import { query, request } from '../src/api/core.js'

export function listPostings(params = {}) {
  return request(`/postings${query(params)}`)
}
