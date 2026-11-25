# T10.1 — Statistics API

Primary code for the statistics endpoints and the client methods.

| File | Purpose |
|---|---|
| `statsStore.js` | Aggregations over the shared tables: summary, weekly, per-company, per-rule, recent activity |
| `statsRoutes.js` | Express routes for `/api/stats/*` |
| `statsApi.js` | Client methods exposed as `api.stats` |

Hooks into shared infrastructure:

- `server/tables.js` exports the live `tables` store so the stats module can read it without a circular import through `server/store.js`.
- `server/store.js` re-exports the stats functions for backward compatibility.

Filters (`{ weeks, companyId }`) are the server side of T10.3.

Related i18n keys: `dash.*`. Consumed by `T10.2/Dashboard.jsx`.
