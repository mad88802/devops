/**
 * T7.1 — Posting list/search route.
 *
 * `GET /api/postings` accepts q, status, companyId, minRisk, sort, page, limit
 * and pendingOnly. The status filter itself is T7.2; the data query stays in
 * `server/store.js`.
 */
import { Router } from 'express'
import * as store from '../server/store.js'

const router = Router()

router.get('/postings', (req, res) => {
  const { q, status, companyId, minRisk, sort, page, limit, pendingOnly } = req.query
  res.json(
    store.listPostings({
      q,
      status,
      companyId,
      minRisk,
      sort,
      page,
      limit,
      pendingOnly: pendingOnly === '1' || pendingOnly === 'true',
    }),
  )
})

export default router
