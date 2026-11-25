/**
 * T4.3 — Posting create/check routes.
 *
 * The rest of the posting routes stay in `server/api.js`; these two are the
 * endpoints used by the posting form. Mounted by `server/api.js`.
 */
import { Router } from 'express'
import * as store from '../server/store.js'
import { validatePostingPayload } from '../server/validate.js'

const router = Router()

const fail = (res, status, message, fields, meta) =>
  res
    .status(status)
    .json({ error: { message, ...(fields ? { fields } : {}), ...(meta ? { meta } : {}) } })

router.post('/postings', (req, res) => {
  const { ok, errors, data } = validatePostingPayload(req.body)
  if (!ok) return fail(res, 422, 'error.validation', errors)

  if (data.company.companyId && !store.getCompany(data.company.companyId)) {
    return fail(res, 422, 'error.validation', { 'company.companyId': 'error.coded' })
  }

  const posting = store.createPosting({ ...data, recruiterId: req.body?.recruiterId })
  res.status(201).json({ posting })
})

/** R.ToCheck(P, Infos) — evaluate R1–R8 by precedence. */
router.post('/postings/:id/check', (req, res) => {
  const outcome = store.checkPosting(req.params.id, { recruiterId: req.body?.recruiterId })
  if (!outcome) return fail(res, 404, 'error.notFound')
  res.json(outcome)
})

export default router
