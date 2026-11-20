/**
 * Shared in-memory table store.
 *
 * Extracted from `server/store.js` so the T10.1 statistics module can read the
 * same tables without importing the whole repository layer (which would create
 * a circular dependency). `tables` is a live ES module binding: after
 * `resetDatabase()` every importer sees the reseeded arrays.
 */
import { buildSeed } from './seed.js'

export const DAY = 24 * 60 * 60 * 1000

export let tables = buildSeed()

export function resetDatabase() {
  tables = buildSeed()
  return tables
}

export function getTables() {
  return tables
}
