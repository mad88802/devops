# T7.1 — Posting list and search UI

Primary code for the recruiter inbox and the candidate browse list.

| File | Purpose |
|---|---|
| `Inbox.jsx` | Recruiter list: debounced search, sort, table, paging, per-row check action |
| `Browse.jsx` | Candidate list: search, cards, status/risk and report action |
| `DataTable.jsx` | Generic table shell with skeletons, empty state and keyboard rows |
| `Pagination.jsx` | Page footer |
| `postingListApi.js` | `GET /api/postings` client method |
| `postingsListRoutes.js` | Express route for `GET /api/postings` |

Dependencies:

- `T5.3/StatusBadge.jsx`, `T5.3/RiskRuler.jsx` — list columns/cards.
- `T7.3/ReportDialog.jsx` — candidate report action.

Existing import paths remain valid through shims:

- `src/pages/recruiter/Inbox.jsx` → `T7.1/Inbox.jsx`
- `src/pages/candidate/Browse.jsx` → `T7.1/Browse.jsx`
- `src/components/DataTable.jsx` → `T7.1/DataTable.jsx`
- `src/components/Small.jsx` re-exports `Pagination`.

Related shared styling: `.table`, `.toolbar`, `.joblist` blocks.
Related i18n keys: `inbox.*`, `browse.*`, `common.search`, `common.all`.
