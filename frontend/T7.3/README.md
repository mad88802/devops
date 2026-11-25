# T7.3 — Report button

Primary code for the candidate report flow.

| File | Purpose |
|---|---|
| `ReportDialog.jsx` | Modal with the four report reasons and the R9/R10 toast |
| `reportReasons.js` | `REPORT_REASONS` |
| `reportApi.js` | `GET /api/reports`, `POST /api/reports` client methods |
| `reportsRoutes.js` | Express routes for reports (R9/R10) |

Existing import paths remain valid through shims:

- `src/components/ReportDialog.jsx` → `T7.3/ReportDialog.jsx`
- `shared/fields.js` re-exports `REPORT_REASONS`.

Used by `T5.1/PostingView.jsx` and `T7.1/Inbox.jsx`/`Browse.jsx`.
Related i18n keys: `report.*`, `browse.report`, `browse.reported`.
