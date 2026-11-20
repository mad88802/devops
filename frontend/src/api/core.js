/**
 * Generic API plumbing shared by every task API module.
 *
 * Task modules (`T4.3/postingApi.js`, `T7.1/postingListApi.js`,
 * `T7.3/reportApi.js`, `T10.1/statsApi.js`) import `request` and `query` from
 * here. `src/api/client.js` assembles the final `api` facade.
 */

export const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(status, payload) {
    const error = payload?.error ?? {}
    super(error.message || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    /** i18n key for the message, e.g. 'error.validation' */
    this.key = error.message || 'error.server'
    /** field path -> i18n key */
    this.fields = error.fields ?? null
    this.meta = error.meta ?? null
  }
}

export function query(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const string = search.toString()
  return string ? `?${string}` : ''
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (networkError) {
    if (networkError?.name === 'AbortError') throw networkError
    throw new ApiError(0, { error: { message: 'error.network' } })
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) throw new ApiError(response.status, payload)
  return payload
}
