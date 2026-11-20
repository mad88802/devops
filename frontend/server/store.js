/**
 * In-memory repository layer for the mock API.
 *
 * The tables mirror the class model of Figure 1 one-to-one:
 *   company, jobPosting, salaryIndicators, feeIndicators, contentIndicators,
 *   report, classificationResult, recruiter, candidate, itAdmin, ecaRule
 *
 * The API composes them into the single "posting" object the UI consumes, so
 * swapping this file for real SQL against the teammate's schema is a change of
 * repository layer only — no route or component has to move.
 *
 * Table ownership:
 *   server/tables.js          live table arrays + reset (shared with T10.1)
 *   T10.1/statsStore.js       statistics aggregations (re-exported below)
 *   T7.2/parseStatus.js       status query parsing used by listPostings()
 *
 * Rule evaluation is delegated to T5.2/rules.js via the shared/rules.js shim.
 */
import { DAY, getTables, resetDatabase, tables } from './tables.js'
import {
  evaluateCheck,
  evaluateCompanyEvent,
  evaluateInsertEvent,
  evaluateReportEvent,
} from '../shared/rules.js'
import { parseStatusFilter } from '../T7.2/parseStatus.js'

// Keep the store facade stable for server/api.js.
export { getTables, resetDatabase }

function nextId(table) {
  return table.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

const today = () => new Date().toISOString().slice(0, 10)
const nowIso = () => new Date().toISOString()

export function daysSince(dateString) {
  if (!dateString) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / DAY))
}

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export function listCompanies({ q, blacklisted } = {}) {
  let rows = [...tables.company]
  if (q) {
    const needle = q.toLowerCase()
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.country.toLowerCase().includes(needle) ||
        c.industry.toLowerCase().includes(needle),
    )
  }
  if (blacklisted === 0 || blacklisted === 1) rows = rows.filter((c) => c.blacklisted === blacklisted)
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export function getCompany(id) {
  return tables.company.find((c) => c.id === Number(id)) ?? null
}

export function createCompany(data) {
  const company = {
    id: nextId(tables.company),
    name: data.name,
    country: data.country,
    industry: data.industry || '',
    ageYears: Number(data.ageYears ?? 0),
    hasProfile: Number(data.hasProfile ?? 1),
    websiteVerified: Number(data.websiteVerified ?? 0),
    postingsLast24h: Number(data.postingsLast24h ?? 0),
    fakePostingsCount: 0,
    blacklisted: Number(data.blacklisted ?? 0),
    createdAt: nowIso(),
  }
  tables.company.push(company)
  return company
}

export function updateCompany(id, patch) {
  const company = getCompany(id)
  if (!company) return null
  const editable = [
    'name',
    'country',
    'industry',
    'ageYears',
    'hasProfile',
    'websiteVerified',
    'postingsLast24h',
    'blacklisted',
  ]
  for (const key of editable) {
    if (patch[key] !== undefined) company[key] = patch[key]
  }
  return company
}

export function deleteCompany(id, { force = false } = {}) {
  const company = getCompany(id)
  if (!company) return { ok: false, reason: 'not_found' }
  const owned = tables.jobPosting.filter((p) => p.companyId === company.id)
  if (owned.length > 0 && !force) return { ok: false, reason: 'has_postings', count: owned.length }
  for (const posting of owned) deletePosting(posting.id)
  tables.company = tables.company.filter((c) => c.id !== company.id)
  return { ok: true, removedPostings: owned.length }
}

/** R11: blacklist a repeat offender (FakePostingsCount >= 3). */
export function checkCompany(id) {
  const company = getCompany(id)
  if (!company) return null
  const { trace, fired } = evaluateCompanyEvent(company)
  const acted = fired && company.blacklisted !== 1
  if (acted) company.blacklisted = 1
  return { company, trace, fired, acted }
}

/* ------------------------------------------------------------------ */
/* Postings                                                            */
/* ------------------------------------------------------------------ */

function nextPostingId() {
  return nextId(tables.jobPosting)
}

export function salaryOf(postingId) {
  return tables.salaryIndicators.find((s) => s.postingId === postingId) ?? null
}
export function feeOf(postingId) {
  return tables.feeIndicators.find((f) => f.postingId === postingId) ?? null
}
export function contentOf(postingId) {
  return tables.contentIndicators.find((c) => c.postingId === postingId) ?? null
}

export function countReports(postingId) {
  return tables.report.filter((r) => r.postingId === postingId).length
}

export function latestClassification(postingId) {
  const rows = tables.classificationResult
    .filter((r) => r.postingId === postingId)
    .sort((a, b) => (a.decisionDate < b.decisionDate ? 1 : -1))
  return rows[0] ?? null
}

/** The fact base the rule engine reads. */
export function factsOf(postingId) {
  const posting = tables.jobPosting.find((p) => p.id === Number(postingId))
  if (!posting) return null
  const company = getCompany(posting.companyId) ?? {}
  const salary = salaryOf(posting.id) ?? {}
  const fee = feeOf(posting.id) ?? {}
  const content = contentOf(posting.id) ?? {}
  return {
    company: {
      hasProfile: company.hasProfile,
      websiteVerified: company.websiteVerified,
      blacklisted: company.blacklisted,
      ageYears: company.ageYears,
      postingsLast24h: company.postingsLast24h,
      fakePostingsCount: company.fakePostingsCount,
    },
    salary: {
      salaryLevel: salary.salaryLevel,
      salaryHidden: salary.salaryHidden,
    },
    fee: {
      feeRequested: fee.feeRequested,
      feeType: fee.feeType,
      paymentBeforeInterview: fee.paymentBeforeInterview,
    },
    content: {
      personalInfoRequested: content.personalInfoRequested,
      urgencyLanguage: content.urgencyLanguage,
      descriptionQuality: content.descriptionQuality,
      contactChannel: content.contactChannel,
    },
    posting: { status: posting.status, riskScore: posting.riskScore },
    reports: { count: countReports(posting.id) },
  }
}

export function composePosting(posting, { detail = false } = {}) {
  const company = getCompany(posting.companyId)
  const salary = salaryOf(posting.id)
  const fee = feeOf(posting.id)
  const content = contentOf(posting.id)
  const reports = tables.report.filter((r) => r.postingId === posting.id)
  const latest = latestClassification(posting.id)

  const composed = {
    id: posting.id,
    title: posting.title,
    description: posting.description,
    location: posting.location,
    employmentType: posting.employmentType,
    postedDate: posting.postedDate,
    status: posting.status,
    riskScore: posting.riskScore,
    ageDays: daysSince(posting.postedDate),
    company: company
      ? {
          id: company.id,
          name: company.name,
          country: company.country,
          industry: company.industry,
          ageYears: company.ageYears,
          hasProfile: company.hasProfile,
          websiteVerified: company.websiteVerified,
          postingsLast24h: company.postingsLast24h,
          fakePostingsCount: company.fakePostingsCount,
          blacklisted: company.blacklisted,
        }
      : null,
    salary: salary
      ? {
          salaryMin: salary.salaryMin,
          salaryMax: salary.salaryMax,
          currency: salary.currency,
          salaryLevel: salary.salaryLevel,
          salaryHidden: salary.salaryHidden,
        }
      : null,
    fee: fee
      ? {
          feeRequested: fee.feeRequested,
          feeType: fee.feeType,
          paymentBeforeInterview: fee.paymentBeforeInterview,
        }
      : null,
    content: content
      ? {
          personalInfoRequested: content.personalInfoRequested,
          urgencyLanguage: content.urgencyLanguage,
          descriptionQuality: content.descriptionQuality,
          contactChannel: content.contactChannel,
        }
      : null,
    reportCount: reports.length,
    lastReportedAt: reports.length
      ? reports.map((r) => r.reportDate).sort().slice(-1)[0]
      : null,
    firedRule: latest && latest.mode === 'auto' ? latest.ruleId : null,
    checkedAt: latest ? latest.decisionDate : null,
    checkedBy: latest ? latest.recruiterId : null,
  }

  if (detail) {
    composed.history = classificationHistory(posting.id)
    composed.reports = reports
      .map((report) => ({
        ...report,
        candidate: tables.candidate.find((c) => c.id === report.candidateId) ?? null,
      }))
      .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1))
  }

  return composed
}

export function getPostingDetail(id) {
  const posting = tables.jobPosting.find((p) => p.id === Number(id))
  return posting ? composePosting(posting, { detail: true }) : null
}

export function classificationHistory(postingId) {
  return tables.classificationResult
    .filter((r) => r.postingId === Number(postingId))
    .map((r) => {
      const recruiter = tables.recruiter.find((x) => x.id === r.recruiterId)
      return {
        ...r,
        recruiterName: recruiter ? `${recruiter.name} ${recruiter.surname}` : 'System',
      }
    })
    .sort((a, b) => (a.decisionDate < b.decisionDate ? 1 : -1))
}

/** Severity order of a verdict. A check may escalate it, never clear it. */
const STATUS_RANK = { P: 0, L: 1, S: 2, F: 3 }

/**
 * T7.1 — posting list, search (`q` matches title / location / company) and
 *        paging/sorting.
 * T7.2 — status filter (`status`, single code or comma-separated list).
 */
export function listPostings({
  q,
  status,
  companyId,
  minRisk,
  sort = 'recent',
  page = 1,
  limit = 10,
  pendingOnly,
} = {}) {
  let rows = tables.jobPosting.map((posting) => composePosting(posting))

  if (q) {
    const needle = q.toLowerCase()
    rows = rows.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.location.toLowerCase().includes(needle) ||
        (p.company && p.company.name.toLowerCase().includes(needle)),
    )
  }
  const wantedStatuses = parseStatusFilter(status)
  if (wantedStatuses.length) rows = rows.filter((p) => wantedStatuses.includes(p.status))
  if (companyId) rows = rows.filter((p) => p.company && p.company.id === Number(companyId))
  if (minRisk !== undefined && minRisk !== '') rows = rows.filter((p) => p.riskScore >= Number(minRisk))
  if (pendingOnly) rows = rows.filter((p) => p.status === 'P' || p.status === 'S')

  const sorters = {
    recent: (a, b) => (a.postedDate < b.postedDate ? 1 : -1),
    oldest: (a, b) => (a.postedDate > b.postedDate ? 1 : -1),
    risk: (a, b) => b.riskScore - a.riskScore,
    title: (a, b) => a.title.localeCompare(b.title),
    reported: (a, b) => b.reportCount - a.reportCount,
  }
  rows.sort(sorters[sort] ?? sorters.recent)

  const total = rows.length
  const pageNumber = Math.max(1, Number(page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10))
  const items = rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)

  return { items, total, page: pageNumber, limit: pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export function getPostingRow(id) {
  return tables.jobPosting.find((p) => p.id === Number(id)) ?? null
}

/**
 * Create the posting + its three indicator rows.
 *
 * R12 (Reject_Blacklisted_Company) is applied at insertion: a posting for a
 * blacklisted company enters the platform already Fake with a score of 100.
 */
export function createPosting(payload) {
  let company = null
  if (payload.company && payload.company.companyId) {
    company = getCompany(payload.company.companyId)
  } else if (payload.company) {
    company = createCompany(payload.company)
  }

  const id = nextPostingId()
  const posting = {
    id,
    companyId: company ? company.id : null,
    title: payload.posting.title,
    description: payload.posting.description ?? '',
    location: payload.posting.location ?? '',
    employmentType: Number(payload.posting.employmentType ?? 0),
    postedDate: payload.posting.postedDate || today(),
    status: 'P',
    riskScore: 0,
  }

  // R12 — insertion of a posting for a blacklisted company.
  const insert = company ? evaluateInsertEvent(company) : { fired: null }
  if (insert.fired) {
    posting.status = 'F'
    posting.riskScore = 100
  }

  tables.jobPosting.push(posting)
  tables.salaryIndicators.push({
    postingId: id,
    salaryMin: numberOrNull(payload.salary?.salaryMin),
    salaryMax: numberOrNull(payload.salary?.salaryMax),
    currency: payload.salary?.currency ?? null,
    salaryLevel: Number(payload.salary?.salaryLevel ?? 0),
    salaryHidden: Number(payload.salary?.salaryHidden ?? 0),
  })
  tables.feeIndicators.push({
    postingId: id,
    feeRequested: Number(payload.fee?.feeRequested ?? 0),
    feeType: Number(payload.fee?.feeType ?? 0),
    paymentBeforeInterview: Number(payload.fee?.paymentBeforeInterview ?? 0),
  })
  tables.contentIndicators.push({
    postingId: id,
    personalInfoRequested: Number(payload.content?.personalInfoRequested ?? 0),
    urgencyLanguage: Number(payload.content?.urgencyLanguage ?? 0),
    descriptionQuality: Number(payload.content?.descriptionQuality ?? 1),
    contactChannel: Number(payload.content?.contactChannel ?? 0),
  })

  if (insert.fired && payload.recruiterId) {
    recordClassification({
      postingId: id,
      recruiterId: payload.recruiterId,
      label: 'F',
      score: 100,
      ruleId: insert.fired.code,
      mode: 'auto',
    })
  }

  return composePosting(posting, { detail: true })
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function updatePosting(id, payload) {
  const posting = getPostingRow(id)
  if (!posting) return null

  if (payload.company && payload.company.companyId) {
    const company = getCompany(payload.company.companyId)
    if (company) posting.companyId = company.id
  } else if (payload.company && payload.company.name) {
    const company = createCompany(payload.company)
    posting.companyId = company.id
  }

  const p = payload.posting ?? {}
  if (p.title !== undefined) posting.title = p.title
  if (p.description !== undefined) posting.description = p.description
  if (p.location !== undefined) posting.location = p.location
  if (p.employmentType !== undefined) posting.employmentType = Number(p.employmentType)
  if (p.postedDate !== undefined) posting.postedDate = p.postedDate

  const salary = salaryOf(posting.id)
  const fee = feeOf(posting.id)
  const content = contentOf(posting.id)

  if (salary && payload.salary) {
    salary.salaryMin = numberOrNull(payload.salary.salaryMin)
    salary.salaryMax = numberOrNull(payload.salary.salaryMax)
    salary.currency = payload.salary.currency ?? null
    salary.salaryLevel = Number(payload.salary.salaryLevel ?? 0)
    salary.salaryHidden = Number(payload.salary.salaryHidden ?? 0)
  }
  if (fee && payload.fee) {
    fee.feeRequested = Number(payload.fee.feeRequested ?? 0)
    fee.feeType = Number(payload.fee.feeType ?? 0)
    fee.paymentBeforeInterview = Number(payload.fee.paymentBeforeInterview ?? 0)
  }
  if (content && payload.content) {
    content.personalInfoRequested = Number(payload.content.personalInfoRequested ?? 0)
    content.urgencyLanguage = Number(payload.content.urgencyLanguage ?? 0)
    content.descriptionQuality = Number(payload.content.descriptionQuality ?? 1)
    content.contactChannel = Number(payload.content.contactChannel ?? 0)
  }

  return composePosting(posting, { detail: true })
}

export function deletePosting(id) {
  const posting = getPostingRow(id)
  if (!posting) return false
  tables.jobPosting = tables.jobPosting.filter((p) => p.id !== posting.id)
  tables.salaryIndicators = tables.salaryIndicators.filter((s) => s.postingId !== posting.id)
  tables.feeIndicators = tables.feeIndicators.filter((f) => f.postingId !== posting.id)
  tables.contentIndicators = tables.contentIndicators.filter((c) => c.postingId !== posting.id)
  tables.report = tables.report.filter((r) => r.postingId !== posting.id)
  tables.classificationResult = tables.classificationResult.filter((r) => r.postingId !== posting.id)
  refreshCompanyStats()
  return true
}

export function recordClassification({
  postingId,
  recruiterId,
  label,
  score,
  ruleId,
  mode = 'auto',
  reason = null,
}) {
  const row = {
    id: nextId(tables.classificationResult),
    postingId: Number(postingId),
    recruiterId: recruiterId ? Number(recruiterId) : null,
    label,
    score: Number(score),
    ruleId: ruleId ?? null,
    decisionDate: nowIso(),
    mode,
    reason,
  }
  tables.classificationResult.push(row)
  return row
}

/**
 * Recruiter triggers ToCheck(P, Infos): evaluate R1–R8 by precedence.
 *
 * A verdict can escalate on its own but never de-escalates: a blacklisted
 * company's posting stays Fake even if a milder rule would now match, and a
 * cleared indicator set does not silently reopen a fraud case. Downgrades go
 * through the manual decision route, which records who did it and why.
 */
export function checkPosting(id, { recruiterId } = {}) {
  const posting = getPostingRow(id)
  if (!posting) return null

  const facts = factsOf(posting.id)
  const result = evaluateCheck(facts)
  const previousStatus = posting.status
  const previousScore = posting.riskScore

  const proposedStatus = result.fired ? result.status : previousStatus
  posting.status =
    STATUS_RANK[proposedStatus] >= STATUS_RANK[previousStatus] ? proposedStatus : previousStatus
  posting.riskScore = result.riskScore

  let classification = null
  if (result.fired) {
    classification = recordClassification({
      postingId: posting.id,
      recruiterId,
      label: result.fired.group,
      score: result.riskScore,
      ruleId: result.fired.code,
      mode: 'auto',
    })
  }

  refreshCompanyStats()

  return {
    posting: composePosting(posting, { detail: true }),
    result,
    classification,
    changed: posting.status !== previousStatus || posting.riskScore !== previousScore,
  }
}

/** A recruiter overrides the machine verdict. Recorded as a manual decision. */
export function overrideVerdict(id, { recruiterId, status, reason }) {
  const posting = getPostingRow(id)
  if (!posting) return null
  posting.status = status
  const row = recordClassification({
    postingId: posting.id,
    recruiterId,
    label: status,
    score: posting.riskScore,
    ruleId: null,
    mode: 'manual',
    reason,
  })
  refreshCompanyStats()
  return { posting: composePosting(posting, { detail: true }), classification: row }
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

/**
 * T7.3 — Candidate files a report: R9 and R10 are evaluated on the report
 * event, then the escalation calls ToCheck, exactly as the sequence diagram
 * shows. The response `effects` array drives the ReportDialog toast.
 */
export function createReport({ postingId, candidateId, reason }) {
  const posting = getPostingRow(postingId)
  if (!posting) return null

  const row = {
    id: nextId(tables.report),
    postingId: posting.id,
    candidateId: Number(candidateId),
    reason: Number(reason),
    reportDate: nowIso(),
  }
  tables.report.push(row)

  const facts = factsOf(posting.id)
  const event = evaluateReportEvent(facts)
  const effects = []

  for (const rule of event.fired) {
    if (rule.code === 'R9' && posting.status !== 'F') {
      posting.status = 'S'
      effects.push({ rule: 'R9', type: 'status', value: 'S' })
    }
    if (rule.code === 'R10') {
      posting.riskScore = Math.min(100, posting.riskScore + 20)
      effects.push({ rule: 'R10', type: 'risk', value: posting.riskScore })
    }
  }

  const recheck = checkPosting(posting.id, { recruiterId: null })

  return {
    report: row,
    event,
    effects,
    posting: composePosting(posting, { detail: true }),
    recheck: recheck ? recheck.result : null,
    reportCount: countReports(posting.id),
  }
}

export function listReports({ postingId } = {}) {
  let rows = [...tables.report]
  if (postingId) rows = rows.filter((r) => r.postingId === Number(postingId))
  return rows
    .map((report) => {
      const posting = getPostingRow(report.postingId)
      const candidate = tables.candidate.find((c) => c.id === report.candidateId)
      return {
        ...report,
        postingTitle: posting ? posting.title : null,
        postingStatus: posting ? posting.status : null,
        candidateName: candidate ? `${candidate.name} ${candidate.surname}` : null,
      }
    })
    .sort((a, b) => (a.reportDate < b.reportDate ? 1 : -1))
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export function listRecruiters() {
  return [...tables.recruiter].sort((a, b) => a.name.localeCompare(b.name))
}
export function getRecruiter(id) {
  return tables.recruiter.find((r) => r.id === Number(id)) ?? null
}
export function createRecruiter(data) {
  const recruiter = {
    id: nextId(tables.recruiter),
    name: data.name,
    surname: data.surname,
    email: data.email,
    role: data.role || 'R',
  }
  tables.recruiter.push(recruiter)
  return recruiter
}
export function updateRecruiter(id, patch) {
  const recruiter = getRecruiter(id)
  if (!recruiter) return null
  for (const key of ['name', 'surname', 'email', 'role']) {
    if (patch[key] !== undefined) recruiter[key] = patch[key]
  }
  return recruiter
}
export function deleteRecruiter(id) {
  const recruiter = getRecruiter(id)
  if (!recruiter) return false
  tables.recruiter = tables.recruiter.filter((r) => r.id !== recruiter.id)
  return true
}

export function listCandidates() {
  return [...tables.candidate].sort((a, b) => a.name.localeCompare(b.name))
}

export function getCandidate(id) {
  return tables.candidate.find((c) => c.id === Number(id)) ?? null
}

/* ------------------------------------------------------------------ */
/* Derived statistics (US10)                                           */
/* ------------------------------------------------------------------ */

/** Recompute FakePostingsCount from the postings themselves. */
export function refreshCompanyStats() {
  for (const company of tables.company) {
    const owned = tables.jobPosting.filter((p) => p.companyId === company.id)
    company.fakePostingsCount = owned.filter((p) => p.status === 'F').length
  }
}

/* ------------------------- T10.1 — Statistics API ------------------------ */

// The statistics implementation lives in T10.1/statsStore.js. Re-exporting it
// keeps the existing `store.statsSummary()` call sites in server/api.js valid.
export {
  statsSummary,
  statsWeekly,
  statsByCompany,
  statsByRule,
  recentActivity,
} from '../T10.1/statsStore.js'
