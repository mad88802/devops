/**
 * T7.3 — Report routes.
 *
 * Cd.Report(P, Reason): applies R9 / R10 and then re-runs ToCheck.
 * Mounted by `server/api.js`; the store and validator stay shared.
 */
import { Router } from 'express'
import * as store from '../server/store.js'
import { validateReportPayload } from '../server/validate.js'

const router = Router()

const fail = (res, status, message, fields, meta) =>
  res
    .status(status)
    .json({ error: { message, ...(fields ? { fields } : {}), ...(meta ? { meta } : {}) } })

router.get('/reports', (req, res) => {
  res.json({ items: store.listReports({ postingId: req.query.postingId }) })
})

router.post('/reports', (req, res) => {
  const { ok, errors, data } = validateReportPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)
  if (!store.getPostingRow(data.postingId)) return fail(res, 404, 'error.postingNotFound')
  if (!store.getCandidate(data.candidateId)) return fail(res, 404, 'error.candidateNotFound')

  const outcome = store.createReport(data)
  res.status(201).json(outcome)
})

export default router
