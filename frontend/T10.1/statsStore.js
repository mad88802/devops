/**
 * T10.1 — Statistics aggregation.
 *
 * Reads the shared in-memory tables and produces the shapes consumed by
 * `GET /api/stats/*`. The optional `{ weeks, companyId }` filters are the
 * server side of T10.3.
 *
 * `server/store.js` re-exports these functions so existing imports keep
 * working; `T10.1/statsRoutes.js` mounts the HTTP routes.
 */
import { DAY, tables } from '../server/tables.js'

/** Monday 00:00 of the week containing `date` (local time). */
function weekStart(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Local calendar day, YYYY-MM-DD. Compared as strings to avoid UTC drift. */
function isoDay(date) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Normalise the filter values shared by every stats query. */
function statsOptions({ weeks, companyId } = {}) {
  const hasWeeks = weeks !== undefined && weeks !== null && weeks !== ''
  const parsedWeeks = Number(weeks)
  const parsedCompany = Number(companyId)
  return {
    weeks:
      hasWeeks && Number.isFinite(parsedWeeks) && parsedWeeks > 0
        ? Math.min(104, Math.floor(parsedWeeks))
        : null,
    companyId:
      Number.isFinite(parsedCompany) && parsedCompany > 0 ? parsedCompany : null,
  }
}

/** First calendar day of the "last N weeks" window. */
function statsWindowStart(weeks) {
  const start = weekStart(new Date())
  start.setDate(start.getDate() - (weeks - 1) * 7)
  return isoDay(start)
}

/** Postings inside the window, optionally restricted to one company. */
function filteredPostings(filters = {}) {
  const options = statsOptions(filters)
  const start = options.weeks === null ? null : statsWindowStart(options.weeks)
  return tables.jobPosting.filter((posting) => {
    if (options.companyId !== null && posting.companyId !== options.companyId) return false
    if (start === null) return true
    return String(posting.postedDate).slice(0, 10) >= start
  })
}

export function statsSummary(filters = {}) {
  const options = statsOptions(filters)
  const scoped = options.weeks !== null || options.companyId !== null
  const postings = filteredPostings(options)
  const postingIds = new Set(postings.map((posting) => posting.id))
  const byStatus = { P: 0, L: 0, S: 0, F: 0 }
  for (const posting of postings) byStatus[posting.status] += 1
  const total = postings.length
  const weekAgo = Date.now() - 7 * DAY
  const reports7d = tables.report.filter(
    (r) => postingIds.has(r.postingId) && new Date(r.reportDate).getTime() >= weekAgo,
  ).length

  return {
    total,
    byStatus,
    fakeShare: total ? Math.round((byStatus.F / total) * 1000) / 10 : 0,
    suspiciousShare: total ? Math.round((byStatus.S / total) * 1000) / 10 : 0,
    pending: byStatus.P,
    reports7d,
    companies:
      options.companyId !== null || options.weeks !== null
        ? new Set(postings.map((posting) => posting.companyId)).size
        : tables.company.length,
    blacklisted:
      options.companyId !== null
        ? tables.company.filter((c) => c.id === options.companyId && c.blacklisted === 1).length
        : tables.company.filter((c) => c.blacklisted === 1).length,
    avgRisk: total ? Math.round(postings.reduce((sum, p) => sum + p.riskScore, 0) / total) : 0,
    checkedTotal: scoped
      ? tables.classificationResult.filter((row) => postingIds.has(row.postingId)).length
      : tables.classificationResult.length,
  }
}

// T10.2 — weekly series for the dashboard's WeeklyChart.
// T10.3 — `weeks` sizes the window and `companyId` scopes it.
export function statsWeekly(weeks = 9, filters = {}) {
  const options = statsOptions({ ...filters, weeks })
  const count = options.weeks ?? 9
  const buckets = []
  const current = weekStart(new Date())
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(current)
    start.setDate(current.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const startDay = isoDay(start)
    const endDay = isoDay(end)
    const rows = tables.jobPosting.filter((p) => {
      if (options.companyId !== null && p.companyId !== options.companyId) return false
      const day = String(p.postedDate).slice(0, 10)
      return day >= startDay && day < endDay
    })
    const byStatus = { P: 0, L: 0, S: 0, F: 0 }
    for (const row of rows) byStatus[row.status] += 1
    buckets.push({
      weekStart: startDay,
      total: rows.length,
      byStatus,
      fake: byStatus.F,
      fakeShare: rows.length ? Math.round((byStatus.F / rows.length) * 100) : 0,
    })
  }
  return buckets
}

// T10.2 — per-company fake-share bars on the dashboard.
// T10.3 — with companyId set, returns just that company (even at zero) so the
//          selected filter is visible; otherwise the top `limit` companies.
export function statsByCompany(limit = 8, filters = {}) {
  const options = statsOptions(filters)
  const start = options.weeks === null ? null : statsWindowStart(options.weeks)
  const scoped =
    options.companyId !== null
      ? tables.company.filter((company) => company.id === options.companyId)
      : tables.company

  return scoped
    .map((company) => {
      const owned = tables.jobPosting.filter(
        (p) =>
          p.companyId === company.id &&
          (start === null || String(p.postedDate).slice(0, 10) >= start),
      )
      const fake = owned.filter((p) => p.status === 'F').length
      return {
        companyId: company.id,
        name: company.name,
        country: company.country,
        total: owned.length,
        fake,
        suspicious: owned.filter((p) => p.status === 'S').length,
        legit: owned.filter((p) => p.status === 'L').length,
        fakeShare: owned.length ? Math.round((fake / owned.length) * 100) : 0,
        blacklisted: company.blacklisted,
      }
    })
    .filter((row) => row.total > 0 || options.companyId !== null)
    .sort((a, b) => b.fake - a.fake || b.fakeShare - a.fakeShare)
    .slice(0, options.companyId !== null ? 1 : limit)
}

export function statsByRule(filters = {}) {
  const postingIds = new Set(filteredPostings(filters).map((posting) => posting.id))
  const counts = {}
  for (const row of tables.classificationResult) {
    if (!row.ruleId || !postingIds.has(row.postingId)) continue
    counts[row.ruleId] = (counts[row.ruleId] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count)
}

export function recentActivity(limit = 8, filters = {}) {
  const postingIds = new Set(filteredPostings(filters).map((posting) => posting.id))
  return [...tables.classificationResult]
    .filter((row) => postingIds.has(row.postingId))
    .sort((a, b) => (a.decisionDate < b.decisionDate ? 1 : -1))
    .slice(0, limit)
    .map((row) => {
      const posting = tables.jobPosting.find((p) => p.id === row.postingId)
      const company = posting
        ? tables.company.find((c) => c.id === posting.companyId)
        : null
      return {
        id: row.id,
        postingId: row.postingId,
        title: posting ? posting.title : null,
        company: company ? company.name : null,
        label: row.label,
        score: row.score,
        ruleId: row.ruleId,
        mode: row.mode,
        at: row.decisionDate,
      }
    })
}
