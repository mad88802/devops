# T10.2 — Chart UI

Primary code for the dashboard charts.

| File | Purpose |
|---|---|
| `Dashboard.jsx` | KPI cards, weekly chart card, per-company bars, fired-rule bars, recent decisions |
| `WeeklyChart.jsx` | Accessible weekly bar chart with a table-view fallback |

The page accepts `weeks`, `companyId`, `companyName` and `headerActions` props.
T10.3 renders it through a filter wrapper; without that wrapper it shows the
default last-9-weeks scope.

Consumes `T10.1/statsApi.js` via `api.stats`.

Related shared styling: `.stats`, `.dashgrid`, `.chart`, `.hbar` in `src/styles/pages.css`.
Related i18n keys: `dash.*`.
