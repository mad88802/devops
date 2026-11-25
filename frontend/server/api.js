/**
 * HTTP surface of the mock API.
 *
 * Generic routes (auth, companies, people, rules, dev/health) stay in this file.
 * Task-owned routes are mounted from their folders:
 *
 *   T4.3  POST /postings, POST /postings/:id/check ... T4.3/postingsRoutes.js
 *   T7.1  GET  /postings (q, page, limit, sort) ...... T7.1/postingsListRoutes.js
 *   T7.2  GET  /postings?status=P,S,L,F .............. T7.2/parseStatus.js
 *   T7.3  GET/POST /reports (R9 / R10) ............... T7.3/reportsRoutes.js
 *   T10.1 GET /stats/summary|weekly|companies|rules|activity
 *                                                    ... T10.1/statsRoutes.js
 *   T10.3 ?weeks= and ?companyId= on every /stats/* ... T10.1/statsStore.js
 *
 * This file is the contract the real back-end has to implement. The full route
 * list and payloads are documented in ../README.md#6-api-surface.
 */
import { Router } from 'express'
import * as store from './store.js'
import * as authStore from './authStore.js'
import { ALL_RULES } from '../shared/rules.js'
import {
  validateCompanyPayload,
  validatePostingPayload,
  validateRecruiterPayload,
} from './validate.js'
import postingsCreateRoutes from '../T4.3/postingsRoutes.js'
import postingsListRoutes from '../T7.1/postingsListRoutes.js'
import reportsRoutes from '../T7.3/reportsRoutes.js'
import statsRoutes from '../T10.1/statsRoutes.js'

const router = Router()

// T4.3 — posting create/check used by the form.
router.use(postingsCreateRoutes)
// T7.1 — posting list/search route (T7.2 status filter is a query parameter).
router.use(postingsListRoutes)
// T7.3 — candidate reports (R9 / R10).
router.use(reportsRoutes)
// T10.1 — statistics (T10.3 filters are query parameters).
router.use(statsRoutes)

const fail = (res, status, message, fields, meta) =>
  res
    .status(status)
    .json({ error: { message, ...(fields ? { fields } : {}), ...(meta ? { meta } : {}) } })

/* -------------------------------- auth -------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Sign-in against the persistent account store. There is no demo shortcut:
 * an account has to be created through POST /auth/register first.
 */
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) return fail(res, 422, 'error.credentials')

  const account = authStore.authenticate(email, password)
  if (!account) return fail(res, 401, 'error.credentials')
  res.json({ user: authStore.publicUser(account) })
})

/**
 * Sign-up. Creates a persistent account and the matching people-table row so a
 * new recruiter can immediately create postings under their own id.
 */
router.post('/auth/register', (req, res) => {
  const body = req.body ?? {}
  const errors = {}

  const name = String(body.name ?? '').trim()
  const surname = String(body.surname ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const kind = String(body.kind ?? '')
  const role = String(body.role ?? 'R')

  if (!name) errors['auth.name'] = 'error.required'
  else if (name.length > 100) errors['auth.name'] = 'error.maxLength'

  if (!surname) errors['auth.surname'] = 'error.required'
  else if (surname.length > 100) errors['auth.surname'] = 'error.maxLength'

  if (!email) errors['auth.email'] = 'error.required'
  else if (!EMAIL_RE.test(email)) errors['auth.email'] = 'error.email'
  else if (authStore.emailExists(email)) errors['auth.email'] = 'error.emailTaken'

  if (!password) errors['auth.password'] = 'error.required'
  else if (password.length < 8) errors['auth.password'] = 'error.passwordShort'

  if (!['recruiter', 'candidate', 'admin'].includes(kind)) {
    errors['auth.kind'] = 'error.coded'
  } else if (kind === 'recruiter' && !['R', 'P', 'S'].includes(role)) {
    errors['auth.role'] = 'error.coded'
  }

  if (Object.keys(errors).length > 0) return fail(res, 422, 'error.validation', errors)

  const account = authStore.register({ name, surname, email, password, kind, role })
  res.status(201).json({ user: authStore.publicUser(account) })
})

router.get('/auth/accounts', (req, res) => {
  res.json({
    recruiters: store.listRecruiters(),
    candidates: store.listCandidates(),
    admins: store.getTables().itAdmin,
    accounts: authStore.listAccountSummaries(),
  })
})

/* ------------------------------ companies ----------------------------- */

router.get('/companies', (req, res) => {
  const { q, blacklisted } = req.query
  const parsed = blacklisted === undefined || blacklisted === '' ? undefined : Number(blacklisted)
  res.json({ items: store.listCompanies({ q, blacklisted: parsed }) })
})

router.get('/companies/:id', (req, res) => {
  const company = store.getCompany(req.params.id)
  if (!company) return fail(res, 404, 'error.notFound')
  res.json({ company })
})

router.post('/companies', (req, res) => {
  const { ok, errors, data } = validateCompanyPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)
  res.status(201).json({ company: store.createCompany(data) })
})

router.put('/companies/:id', (req, res) => {
  if (!store.getCompany(req.params.id)) return fail(res, 404, 'error.notFound')
  const { ok, errors, data } = validateCompanyPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)
  res.json({ company: store.updateCompany(req.params.id, data) })
})

router.delete('/companies/:id', (req, res) => {
  const force = req.query.force === '1' || req.query.force === 'true'
  const outcome = store.deleteCompany(req.params.id, { force })
  if (!outcome.ok && outcome.reason === 'not_found') return fail(res, 404, 'error.notFound')
  if (!outcome.ok && outcome.reason === 'has_postings') {
    return fail(res, 409, 'error.companyHasPostings', null, { count: outcome.count })
  }
  res.json({ ok: true, removedPostings: outcome.removedPostings ?? 0 })
})

/** R11 — Blacklist_Repeat_Offender. */
router.post('/companies/:id/check', (req, res) => {
  const outcome = store.checkCompany(req.params.id)
  if (!outcome) return fail(res, 404, 'error.notFound')
  res.json(outcome)
})

router.post('/companies/:id/blacklist', (req, res) => {
  const company = store.getCompany(req.params.id)
  if (!company) return fail(res, 404, 'error.notFound')
  const value = Number(req.body?.blacklisted)
  if (![0, 1].includes(value)) return fail(res, 422, 'error.validation', { blacklisted: 'error.coded' })
  store.updateCompany(company.id, { blacklisted: value })
  res.json({ company: store.getCompany(company.id) })
})

/* ------------------------------- postings ----------------------------- */

// T7.1 — GET /postings is mounted from ../T7.1/postingsListRoutes.js above.

router.get('/postings/:id', (req, res) => {
  const posting = store.getPostingDetail(req.params.id)
  if (!posting) return fail(res, 404, 'error.notFound')
  res.json({ posting, facts: store.factsOf(posting.id) })
})

// T4.3 — POST /postings is mounted from ../T4.3/postingsRoutes.js above.

router.put('/postings/:id', (req, res) => {
  if (!store.getPostingRow(req.params.id)) return fail(res, 404, 'error.notFound')
  const { ok, errors, data } = validatePostingPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)
  res.json({ posting: store.updatePosting(req.params.id, data) })
})

router.delete('/postings/:id', (req, res) => {
  if (!store.deletePosting(req.params.id)) return fail(res, 404, 'error.notFound')
  res.json({ ok: true })
})

// T4.3 — POST /postings/:id/check is mounted from ../T4.3/postingsRoutes.js.

/** Human adjudication of a machine verdict. Recorded in the classification history. */
router.post('/postings/:id/override', (req, res) => {
  const { status, reason, recruiterId } = req.body ?? {}
  if (!['P', 'L', 'S', 'F'].includes(status)) {
    return fail(res, 422, 'error.validation', { status: 'error.coded' })
  }
  if (!String(reason ?? '').trim()) {
    return fail(res, 422, 'error.validation', { reason: 'error.required' })
  }
  const outcome = store.overrideVerdict(req.params.id, { status, reason, recruiterId })
  if (!outcome) return fail(res, 404, 'error.notFound')
  res.json(outcome)
})

router.get('/postings/:id/history', (req, res) => {
  if (!store.getPostingRow(req.params.id)) return fail(res, 404, 'error.notFound')
  res.json({ items: store.classificationHistory(req.params.id) })
})

/* -------------------------------- reports ----------------------------- */

// T7.3 — report routes are mounted from ../T7.3/reportsRoutes.js above.

/* --------------------------------- people ----------------------------- */

router.get('/recruiters', (req, res) => {
  res.json({ items: store.listRecruiters() })
})

router.post('/recruiters', (req, res) => {
  const { ok, errors, data } = validateRecruiterPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)
  res.status(201).json({ recruiter: store.createRecruiter(data) })
})

router.put('/recruiters/:id', (req, res) => {
  if (!store.getRecruiter(req.params.id)) return fail(res, 404, 'error.notFound')
  const { ok, errors, data } = validateRecruiterPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)
  res.json({ recruiter: store.updateRecruiter(req.params.id, data) })
})

router.delete('/recruiters/:id', (req, res) => {
  if (!store.deleteRecruiter(req.params.id)) return fail(res, 404, 'error.notFound')
  res.json({ ok: true })
})

router.get('/candidates', (req, res) => {
  res.json({ items: store.listCandidates() })
})

router.get('/classifications', (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20))
  res.json({ items: store.recentActivity(limit) })
})

/* -------------------------------- stats ------------------------------- */

// T10.1 — stats routes are mounted from ../T10.1/statsRoutes.js above.
// T10.3 — ?weeks= and ?companyId= are handled in that module.

/* -------------------------------- rules ------------------------------- */

/** The rule repository (US9): rules are data, not compiled code. */
router.get('/rules', (req, res) => {
  res.json({
    items: store.getTables().ecaRule,
    source: 'ecaRule table',
    count: ALL_RULES.length,
  })
})

/* -------------------------------- dev --------------------------------- */

router.post('/dev/reset', (req, res) => {
  store.resetDatabase()
  res.json({ ok: true, postings: store.getTables().jobPosting.length })
})

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'verdict-mock-api',
    tables: Object.fromEntries(Object.entries(store.getTables()).map(([k, v]) => [k, v.length])),
  })
})

export default router
