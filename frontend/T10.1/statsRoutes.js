/**
 * T10.1 — Statistics routes.
 *
 * Every route accepts the T10.3 filters `?weeks=` and `?companyId=`; both are
 * normalised in `statsStore.js`. Mounted by `server/api.js`.
 */
import { Router } from 'express'
import * as stats from './statsStore.js'

const router = Router()

function statsFilters(req) {
  return { weeks: req.query.weeks, companyId: req.query.companyId }
}

router.get('/stats/summary', (req, res) => {
  res.json(stats.statsSummary(statsFilters(req)))
})

// T10.2 data source — last N weeks, used by the WeeklyChart bar chart.
router.get('/stats/weekly', (req, res) => {
  res.json({ items: stats.statsWeekly(req.query.weeks ?? 9, statsFilters(req)) })
})

// T10.2 data source — per-company fake-share bars.
router.get('/stats/companies', (req, res) => {
  res.json({ items: stats.statsByCompany(8, statsFilters(req)) })
})

router.get('/stats/rules', (req, res) => {
  res.json({ items: stats.statsByRule(statsFilters(req)) })
})

router.get('/stats/activity', (req, res) => {
  res.json({
    items: stats.recentActivity(Number(req.query.limit) || 8, statsFilters(req)),
  })
})

export default router
