/**
 * Verdict mock API.
 *
 * Routes are defined in server/api.js and annotated with the task they serve
 * (T4.3 posting create/check, T7.1/T7.2 posting list, T7.3 reports,
 * T10.1 statistics).
 *
 *   npm run dev:api      node --watch, restarts on save
 *   npm start            plain run
 *
 * Deliberately dependency-light: no database, no ORM. Everything lives in
 * memory and is reseeded on start (POST /api/dev/reset reseeds on demand).
 */
import express from 'express'
import cors from 'cors'
import api from './api.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.use((req, res, next) => {
  const started = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - started
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms} ms)`)
  })
  next()
})

app.use('/api', api)

app.use((req, res) => {
  res.status(404).json({ error: { message: 'error.routeNotFound', path: req.originalUrl } })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: { message: 'error.server', detail: err.message } })
})

app.listen(PORT, () => {
  console.log(`\n  Verdict mock API  http://localhost:${PORT}/api`)
  console.log(`  Health            http://localhost:${PORT}/api/health\n`)
})
