/**
 * Persistent account store for the demo authentication.
 *
 * The rest of the mock API lives in memory (server/tables.js), but accounts
 * have to survive an API restart: a user who signs up must still be able to
 * sign in after `npm run dev` is restarted. Accounts are therefore written to
 * `server/data/accounts.json` (git-ignored, created on first start).
 *
 * The store starts empty on purpose. There are no example accounts in the
 * interface: the first recruiter or candidate is created through the Sign up
 * form.
 *
 * Passwords are never stored in clear text. Each account keeps a random salt
 * and a scrypt hash, and verification uses a constant-time comparison.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCandidate, createRecruiter } from './store.js'
import { getTables } from './tables.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(HERE, 'data')
const ACCOUNTS_FILE = join(DATA_DIR, 'accounts.json')

/** @type {Array<object> | null} */
let accounts = null
let nextAccountId = 1

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return {
    salt,
    passwordHash: scryptSync(password, salt, 64).toString('hex'),
  }
}

function verifyPassword(password, account) {
  if (!account?.salt || !account?.passwordHash) return false
  const attempt = scryptSync(password, account.salt, 64)
  const expected = Buffer.from(account.passwordHash, 'hex')
  return expected.length === attempt.length && timingSafeEqual(expected, attempt)
}

function persist() {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(ACCOUNTS_FILE, `${JSON.stringify(accounts, null, 2)}\n`, 'utf8')
}

function load() {
  if (accounts) return accounts

  mkdirSync(DATA_DIR, { recursive: true })

  if (existsSync(ACCOUNTS_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'))
      accounts = Array.isArray(parsed) ? parsed : []
    } catch {
      // A corrupt local file must not stop the API from booting.
      accounts = []
    }
  } else {
    accounts = []
    persist()
  }

  nextAccountId = accounts.reduce((max, account) => Math.max(max, account.id), 0) + 1
  return accounts
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function nextFreeId(table) {
  return table.reduce((max, row) => Math.max(max, row.id), 0) + 1
}

/**
 * Rebuild the link between an account and the in-memory people table.
 *
 * Postings, reports and statistics all reference `recruiter.id` and
 * `candidate.id`. The tables are reseeded on every API start, so a registered
 * account has to be re-attached before it can create a posting or a report.
 */
function ensurePerson(account) {
  const tables = getTables()

  if (account.kind === 'admin') {
    let row = tables.itAdmin.find((admin) => normalizeEmail(admin.email) === account.email)
    if (!row) {
      row = {
        id: nextFreeId(tables.itAdmin),
        name: `${account.name} ${account.surname}`.trim(),
        email: account.email,
      }
      tables.itAdmin.push(row)
    }
    account.userId = row.id
    return row
  }

  const table = account.kind === 'candidate' ? tables.candidate : tables.recruiter
  let row = table.find((person) => normalizeEmail(person.email) === account.email)

  if (!row) {
    row =
      account.kind === 'candidate'
        ? createCandidate({ name: account.name, surname: account.surname, email: account.email })
        : createRecruiter({
            name: account.name,
            surname: account.surname,
            email: account.email,
            role: account.role || 'R',
          })
    account.userId = row.id
    persist()
  }

  return row
}

/** Shape returned to the client and stored in the browser by the React app. */
export function publicUser(account) {
  const person = ensurePerson(account)

  if (account.kind === 'admin') {
    const fullName = person.name
    return {
      id: person.id,
      kind: 'admin',
      name: fullName.split(' ')[0],
      surname: fullName.split(' ').slice(1).join(' '),
      fullName,
      email: account.email,
      role: null,
    }
  }

  return {
    id: person.id,
    kind: account.kind,
    name: person.name,
    surname: person.surname,
    fullName: `${person.name} ${person.surname}`.trim(),
    email: account.email,
    role: account.kind === 'recruiter' ? person.role ?? account.role ?? 'R' : null,
  }
}

export function emailExists(email) {
  const normalized = normalizeEmail(email)
  return load().some((account) => account.email === normalized)
}

/**
 * Create an account and its matching people-table row.
 * Validation (format, duplicate, role) belongs to the route that calls this.
 */
export function register({ name, surname, email, password, kind, role }) {
  const list = load()
  const account = {
    id: nextAccountId++,
    kind,
    userId: null,
    name: String(name ?? '').trim(),
    surname: String(surname ?? '').trim(),
    email: normalizeEmail(email),
    role: kind === 'recruiter' ? role || 'R' : null,
    ...hashPassword(password),
    createdAt: new Date().toISOString(),
  }

  list.push(account)
  ensurePerson(account)
  persist()
  return account
}

/** Returns the account when the password matches, otherwise null. */
export function authenticate(email, password) {
  const normalized = normalizeEmail(email)
  const account = load().find((entry) => entry.email === normalized)
  if (!account) return null
  return verifyPassword(String(password ?? ''), account) ? account : null
}

/** Only for diagnostics: never exposes hashes or salts. */
export function listAccountSummaries() {
  return load().map(({ id, kind, name, surname, email, role, createdAt }) => ({
    id,
    kind,
    name,
    surname,
    email,
    role,
    createdAt,
  }))
}

// Create server/data/accounts.json on first boot, so the tester can see where
// sign-ups are stored without having to sign in first.
load()
