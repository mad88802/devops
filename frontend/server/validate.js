/**
 * Server-side validation of coded values (task T2.2 in the lab).
 *
 * Mirrors the client-side checks written for T4.2 in src/lib/postingPayload.js.
 * The back-end remains authoritative: T4.3's form submit surfaces these errors
 * field-by-field through ApiError.fields.
 *
 * Errors are returned as a map of dotted field path -> i18n key, so the client
 * can attach the message to the exact input without knowing any English text:
 *   { "posting.title": "error.required", "salary.salaryLevel": "error.coded" }
 */
import {
  CURRENCIES,
  FIELD_INDEX,
  POSTING_INPUT_FIELDS,
  isFieldHidden,
  readPath,
} from '../shared/fields.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isBlank(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

/** Validate one flat field descriptor against a value, writing into `errors`. */
function checkField(field, value, errors, payload) {
  if (isFieldHidden(field, payload)) return

  if (field.type === 'coded') {
    if (isBlank(value)) {
      if (field.required) errors[field.key] = 'error.required'
      return
    }
    const numeric = Number(value)
    if (!Number.isInteger(numeric) || !field.options.some((o) => o.value === numeric)) {
      errors[field.key] = 'error.coded'
    }
    return
  }

  if (field.type === 'select') {
    if (isBlank(value)) {
      if (field.required) errors[field.key] = 'error.required'
      return
    }
    if (!field.options.some((o) => o.value === value)) errors[field.key] = 'error.coded'
    return
  }

  if (field.type === 'number') {
    if (isBlank(value)) {
      if (field.required) errors[field.key] = 'error.required'
      return
    }
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
      errors[field.key] = 'error.number'
      return
    }
    if (field.min !== undefined && numeric < field.min) errors[field.key] = 'error.min'
    if (field.max !== undefined && numeric > field.max) errors[field.key] = 'error.max'
    return
  }

  if (field.type === 'date') {
    if (isBlank(value)) {
      if (field.required) errors[field.key] = 'error.required'
      return
    }
    if (!DATE_RE.test(String(value))) errors[field.key] = 'error.date'
    return
  }

  // text / textarea
  if (isBlank(value)) {
    if (field.required) errors[field.key] = 'error.required'
    return
  }
  if (typeof value !== 'string') {
    errors[field.key] = 'error.text'
    return
  }
  if (field.maxLength && value.length > field.maxLength) errors[field.key] = 'error.maxLength'
}

/**
 * Validate a full posting payload:
 *   { posting: {...}, company: {...}, salary: {...}, fee: {...}, content: {...} }
 */
export function validatePostingPayload(body) {
  const errors = {}

  if (!body || typeof body !== 'object') {
    return { ok: false, errors: { _: 'error.body' } }
  }

  const payload = {
    posting: body.posting ?? {},
    company: body.company ?? {},
    salary: body.salary ?? {},
    fee: body.fee ?? {},
    content: body.content ?? {},
  }

  // T4.3 — the company is either referenced by id or created inline. When an
  // existing companyId is supplied, the company creation fields must not be
  // required (the form sends only `{ companyId }` in that mode).
  const companyId = payload.company.companyId
  const creatingCompany = companyId === undefined || companyId === null || companyId === ''
  for (const field of POSTING_INPUT_FIELDS) {
    if (field.readOnly) continue
    if (!creatingCompany && field.group === 'company') continue
    checkField(field, readPath(payload, field.key), errors, payload)
  }

  // Cross-field rules.
  const { salaryMin, salaryMax } = payload.salary
  const hidden = Number(payload.salary.salaryHidden) === 1
  if (!hidden && !isBlank(salaryMin) && !isBlank(salaryMax) && Number(salaryMax) < Number(salaryMin)) {
    errors['salary.salaryMax'] = 'error.salaryRange'
  }
  if (!hidden && !isBlank(payload.salary.currency) && !CURRENCIES.includes(payload.salary.currency)) {
    errors['salary.currency'] = 'error.coded'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: normalisePosting(appliedOptionalFields(payload)),
  }
}

/**
 * A code that is hidden by a parent selector must not travel in the payload:
 * a posting that requests no fee cannot carry a fee type.
 */
function appliedOptionalFields(payload) {
  const clean = JSON.parse(JSON.stringify(payload))

  if (Number(clean.fee.feeRequested) === 0) {
    clean.fee.feeType = 0
    clean.fee.paymentBeforeInterview = 0
  }
  if (Number(clean.salary.salaryHidden) === 1) {
    clean.salary.salaryMin = null
    clean.salary.salaryMax = null
    clean.salary.currency = null
  }
  return clean
}

function normalisePosting(payload) {
  const out = {
    posting: {
      title: String(payload.posting.title ?? '').trim(),
      description: String(payload.posting.description ?? '').trim(),
      location: String(payload.posting.location ?? '').trim(),
      employmentType: Number(payload.posting.employmentType ?? 0),
      postedDate: payload.posting.postedDate,
    },
    company: {},
    salary: {
      salaryMin: toNumberOrNull(payload.salary.salaryMin),
      salaryMax: toNumberOrNull(payload.salary.salaryMax),
      currency: payload.salary.currency ?? null,
      salaryLevel: Number(payload.salary.salaryLevel ?? 0),
      salaryHidden: Number(payload.salary.salaryHidden ?? 0),
    },
    fee: {
      feeRequested: Number(payload.fee.feeRequested ?? 0),
      feeType: Number(payload.fee.feeType ?? 0),
      paymentBeforeInterview: Number(payload.fee.paymentBeforeInterview ?? 0),
    },
    content: {
      personalInfoRequested: Number(payload.content.personalInfoRequested ?? 0),
      urgencyLanguage: Number(payload.content.urgencyLanguage ?? 0),
      descriptionQuality: Number(payload.content.descriptionQuality ?? 1),
      contactChannel: Number(payload.content.contactChannel ?? 0),
    },
  }

  if (payload.company.companyId) {
    out.company = { companyId: Number(payload.company.companyId) }
  } else {
    out.company = {
      name: String(payload.company.name ?? '').trim(),
      country: String(payload.company.country ?? '').trim(),
      industry: String(payload.company.industry ?? '').trim(),
      ageYears: Number(payload.company.ageYears ?? 0),
      hasProfile: Number(payload.company.hasProfile ?? 1),
      websiteVerified: Number(payload.company.websiteVerified ?? 0),
      postingsLast24h: Number(payload.company.postingsLast24h ?? 0),
    }
  }

  return out
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Validate the company form used by the admin CRUD screen (US8). */
export function validateCompanyPayload(body) {
  const errors = {}
  if (!body || typeof body !== 'object') return { ok: false, errors: { _: 'error.body' } }

  const fields = [
    'company.name',
    'company.country',
    'company.industry',
    'company.ageYears',
    'company.hasProfile',
    'company.websiteVerified',
    'company.postingsLast24h',
    'company.blacklisted',
  ]
  const holder = { company: body.company ?? body }
  for (const key of fields) {
    const field = FIELD_INDEX[key]
    if (!field) continue
    const value = readPath(holder, key)
    if (value === undefined && !field.required) continue
    checkField({ ...field, required: key === 'company.name' || key === 'company.country' }, value, errors, holder)
  }

  const data = {
    name: String(body.name ?? '').trim(),
    country: String(body.country ?? '').trim(),
    industry: String(body.industry ?? '').trim(),
    ageYears: Number(body.ageYears ?? 0),
    hasProfile: Number(body.hasProfile ?? 1),
    websiteVerified: Number(body.websiteVerified ?? 0),
    postingsLast24h: Number(body.postingsLast24h ?? 0),
    blacklisted: Number(body.blacklisted ?? 0),
  }
  return { ok: Object.keys(errors).length === 0, errors, data }
}

export function validateRecruiterPayload(body) {
  const errors = {}
  if (!body || typeof body !== 'object') return { ok: false, errors: { _: 'error.body' } }

  const name = String(body.name ?? '').trim()
  const surname = String(body.surname ?? '').trim()
  const email = String(body.email ?? '').trim()
  const role = String(body.role ?? 'R')

  if (!name) errors['recruiter.name'] = 'error.required'
  else if (name.length > 100) errors['recruiter.name'] = 'error.maxLength'
  if (!surname) errors['recruiter.surname'] = 'error.required'
  else if (surname.length > 100) errors['recruiter.surname'] = 'error.maxLength'
  if (!email) errors['recruiter.email'] = 'error.required'
  else if (!EMAIL_RE.test(email)) errors['recruiter.email'] = 'error.email'
  if (!['R', 'P', 'S'].includes(role)) errors['recruiter.role'] = 'error.coded'

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { name, surname, email, role },
  }
}

export function validateReportPayload(body) {
  const errors = {}
  if (!body || typeof body !== 'object') return { ok: false, errors: { _: 'error.body' } }
  const postingId = Number(body.postingId)
  const candidateId = Number(body.candidateId)
  const reason = Number(body.reason)

  if (!Number.isInteger(postingId) || postingId <= 0) errors.postingId = 'error.required'
  if (!Number.isInteger(candidateId) || candidateId <= 0) errors.candidateId = 'error.required'
  if (![1, 2, 3, 4].includes(reason)) errors.reason = 'error.coded'

  return { ok: Object.keys(errors).length === 0, errors, data: { postingId, candidateId, reason } }
}
