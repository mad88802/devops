# Verdict — Fake Job Posting Detection (Frontend)

Team 12 — LAB PRJ12 / ING4-DS.
React 19 + Vite front-end with a dependency-light Node/Express mock API and an
ECA (Event–Condition–Action) rule engine.

This README is written for testers and reviewers. It explains how to run the
app, how the code is organized, where each lab task lives, and how a posting
travels from the form to a verdict.

---

## 1. Quick start

Requirements: Node.js 18+ and npm.

```bash
cd frontend
npm install
npm run dev
```

`npm run dev` starts both processes:

| Process | URL | Command |
|---|---|---|
| Mock API | http://localhost:4000/api | `npm run dev:api` |
| Vite dev server | http://localhost:5173 | `npm run dev:web` |

Production build:

```bash
npm run build     # outputs dist/
npm run preview   # serves the built app
```

The API only:

```bash
npm start
```

Environment:

- `.env.example` documents the available variables.
- `VITE_API_BASE_URL` overrides the API base (default `/api`, proxied by Vite to `:4000`).
- `PORT` changes the mock API port (default `4000`).

Demo data lives in memory and is reseeded on every API start. You can also reset it with:

```bash
curl -X POST http://localhost:4000/api/dev/reset
```

---

## 2. Architecture

Three layers, kept deliberately small so each lab task is testable on its own:

```
React UI (src/ + T#.# task folders)
        │  fetch /api/*
        ▼
Express mock API (server/)
        │  in-memory tables (server/tables.js)
        ▼
ECA rule engine (T5.2/rules.js)
```

### Presentation layer

- `src/` contains the app shell, routing, shared UI, styles and i18n.
- `T4.1/` … `T10.3/` contain the code owned by each lab task.
- Existing `src/`, `shared/` and `server/` paths are kept as **re-export shims**,
  so moving code into a task folder never changes the imports of unrelated pages.

### API layer

- `server/index.js` boots Express.
- `server/api.js` mounts the task routers (postings, reports, stats) and the
  generic admin/people routes.
- `server/store.js` is the repository layer: it composes the normalized tables
  into the `posting` object the UI consumes.
- `server/tables.js` owns the live in-memory tables, so the statistics module
  can read them without a circular import through `store.js`.
- `server/validate.js` repeats the T4.2 client validation on the server; the
  server is authoritative.

### Rule engine

`T5.2/rules.js` is the single ECA rule repository:

- R1–R8: recruiter `R.ToCheck(P, Infos)`, evaluated by precedence (first match wins).
- R9–R10: candidate reports.
- R11: company blacklist check.
- R12: posting insertion for a blacklisted company.

`evaluateCheck(facts)` returns the full trace, the fired rule and the risk score.
The same function powers the form's live preview and the result page, so the
preview can never promise a verdict the server will not return.

---

## 3. Data flow

### Create and classify a posting

```
T4.1 PostingForm
  → T4.2 validatePostingValues()          (client feedback)
  → T4.3 buildPayload()
  → POST /api/postings
      → server/validate.js                (authoritative validation)
      → T4.3/postingsRoutes.js
      → store.createPosting()
          → R12 insertion rule
          → store.checkPosting() / evaluateCheck()  (R1–R8)
          → classificationResult row
  → POST /api/postings/:id/check          (if "Save and check")
  → redirect to T5.1 result page
```

### Report a posting

```
T7.3 ReportDialog
  → POST /api/reports
      → store.createReport()
      → evaluateReportEvent()             (R9 / R10)
      → store.checkPosting()              (re-run R1–R8)
  → toast with the fired report rule and new report count
```

### Dashboard statistics

```
T10.3 DashboardPage (filter state)
  → T10.2 Dashboard (props: weeks, companyId)
  → api.stats.* (T10.1/statsApi.js)
  → GET /api/stats/*?weeks=&companyId=
  → T10.1/statsRoutes.js
  → T10.1/statsStore.js  (aggregates over server/tables.js)
```

---

## 4. Folder map

```
frontend/
├─ index.html
├─ package.json
├─ vite.config.js
├─ README.md                  ← this file
├─ .env.example
│
├─ T4.1/ … T10.3/             ← task-owned code (see the table below)
│
├─ src/
│  ├─ App.jsx                 routes and role guards
│  ├─ main.jsx                React root
│  ├─ api/
│  │  ├─ core.js              fetch wrapper, ApiError, query helper
│  │  └─ client.js            api facade assembled from task API modules
│  ├─ components/             shared UI + shims for task components
│  ├─ context/                auth and toast providers
│  ├─ i18n/                   EN / FR dictionary
│  ├─ lib/                    format helpers, useAsync, shims
│  ├─ pages/                  route-level pages + shims for task pages
│  └─ styles/                 tokens, app shell, page styles
│
├─ shared/
│  ├─ fields.js               re-exports T4.1 fields, T5.3 status, T7.3 reasons
│  └─ rules.js                re-exports T5.2/rules.js
│
└─ server/
   ├─ index.js                Express bootstrap
   ├─ api.js                  route mounting
   ├─ tables.js               live in-memory tables
   ├─ store.js                repository layer
   ├─ validate.js             server-side validation
   ├─ seed.js                 demo data
   └─ …
```

`node_modules/` and `dist/` are build artifacts and are not part of the source.

---

## 5. Task map

Each folder has its own `README.md` with file-level details.

| Task | Folder | What it implements |
|---|---|---|
| T4.1 | `T4.1/` | Posting form UI: sections, company selector, coded controls, live preview |
| T4.2 | `T4.2/` | Client-side validation: required/coded/number/date/range checks |
| T4.3 | `T4.3/` | Payload building, save/check API and posting routes |
| T5.1 | `T5.1/` | Result page (recruiter case file) and candidate result view |
| T5.2 | `T5.2/` | Fired rule, condition ledger and action tokens |
| T5.3 | `T5.3/` | Status badges and the 0–100 risk ruler |
| T7.1 | `T7.1/` | Posting list, search, table, pagination and list API/route |
| T7.2 | `T7.2/` | Status filter chips and status query parsing |
| T7.3 | `T7.3/` | Report button, dialog, report API and report routes |
| T10.1 | `T10.1/` | Statistics store, routes and client methods |
| T10.2 | `T10.2/` | Dashboard charts and KPI panels |
| T10.3 | `T10.3/` | Weekly period and per-company filters |

Shared, task-agnostic code stays in `src/`:

- `Icon`, `Modal`, `Layout`, `Small` (Tabs/Empty/Notice), contexts, i18n, CSS.
- `src/lib/format.js` (status labels, risk band, date/salary formatting).
- `src/lib/useAsync.js` (loading/error state).

---

## 6. API surface

| Method | Route | Used by |
|---|---|---|
| POST | `/api/auth/login` | login |
| GET | `/api/auth/accounts` | login demo accounts |
| GET | `/api/postings?q=&status=&sort=&page=&limit=` | T7.1 list/search, T7.2 filter |
| GET | `/api/postings/:id` | T5.1 result page |
| POST | `/api/postings` | T4.3 form save |
| PUT | `/api/postings/:id` | posting edit |
| POST | `/api/postings/:id/check` | T4.3 save-and-check |
| POST | `/api/postings/:id/override` | manual adjudication |
| GET | `/api/postings/:id/history` | classification history |
| POST | `/api/reports` | T7.3 report |
| GET | `/api/stats/summary?weeks=&companyId=` | T10.2 KPI cards |
| GET | `/api/stats/weekly?weeks=&companyId=` | T10.2 weekly chart |
| GET | `/api/stats/companies?weeks=&companyId=` | T10.2 company bars |
| GET | `/api/stats/rules?weeks=&companyId=` | T10.2 rule bars |
| GET | `/api/stats/activity?limit=&weeks=&companyId=` | T10.2 recent decisions |

Validation errors use a stable shape:

```json
{
  "error": {
    "message": "error.validation",
    "fields": { "posting.title": "error.required" }
  }
}
```

The client maps each `fields[key]` to the matching form input via `ApiError.fields`.

---

## 7. Internationalization and styling

- `src/i18n/index.jsx` holds one flat EN dictionary and one FR dictionary.
  Missing French keys fall back to English.
- Key prefixes map to tasks: `form.*` (T4.x), `detail.*`/`rule.*` (T5.x),
  `inbox.*`/`browse.*` (T7.x), `dash.*` (T10.x).
- `src/styles/tokens.css` defines the design tokens.
- `src/styles/app.css` holds shared primitives (buttons, cards, status, risk, table, inputs, ledger, rules).
- `src/styles/pages.css` holds page layouts (form, case file, browse, dashboard).

---

## 8. Tester checklist

Run `npm run build` first; it must finish without errors.

Then `npm run dev` and verify:

1. **T4.x** — open `/recruiter/postings/new`:
   - submit with empty required fields → inline errors;
   - toggle fee/salary dependent fields → hidden fields disappear;
   - save and check → posting is created, rule preview matches the result page.
2. **T5.x** — open a created posting:
   - status badge, risk ruler and verdict are visible;
   - the fired rule, condition ledger and actions match the stored values;
   - the candidate view shows the same verdict and a report button.
3. **T7.x** — open `/recruiter/inbox`:
   - search by title/company/location, change sort and page;
   - click status chips (P/S/L/F) and verify the list and counts;
   - as a candidate, report a posting and check the toast effect.
4. **T10.x** — open `/recruiter/dashboard`:
   - switch period between 4/9/13/26 weeks → all panels update;
   - select a company → KPIs, chart, company bars, rules and activity are scoped;
   - clear filters returns to the default 9-week/all-companies view.

API smoke tests:

```bash
curl http://localhost:4000/api/health
curl "http://localhost:4000/api/stats/summary?weeks=4"
curl "http://localhost:4000/api/stats/summary?weeks=9&companyId=1"
curl "http://localhost:4000/api/postings?q=data&status=S"
```

---

## 9. Azure DevOps

- Organization/project/repo: `BNKteam / PO_G12 / DEVOPS_G12_WEB-APP`.
- The frontend app is stored under `frontend/` in that repository.
- Integration base branch: `feature/frontend-integration`.
- Each lab task has its own `T#.#` branch and pull request, stacked in dependency
  order. The task folders in this README match those branches.
- This standalone `frontend/` checkout is the working copy; the Azure PR
  branches mirror the same `T#.#` folders under the repository's `frontend/`
  directory.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `EADDRINUSE: 4000` | another API is running; stop it or set `PORT=4001` |
| API calls return 404 | make sure `npm run dev` started both processes |
| Empty dashboard | reset demo data via `POST /api/dev/reset` |
| Build fails on an import | check the task folder path in the task's README; shims under `src/` should point there |
| Wrong role pages | sign out and use the demo accounts on `/login` |
