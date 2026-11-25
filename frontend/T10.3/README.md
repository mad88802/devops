# T10.3 — Weekly and per-company filter

Primary code for the dashboard filter bar.

| File | Purpose |
|---|---|
| `DashboardFilters.jsx` | Company selector, period selector (4/9/13/26 weeks) and clear action |
| `DashboardPage.jsx` | Owns the filter state and company list; renders the T10.2 dashboard with the selected scope |
| `filterParams.js` | Defaults, period options and query-param helper |

Dependencies:

- `T10.2/Dashboard.jsx` — the page that receives `weeks` and `companyId`.
- `T10.1/statsApi.js` — every stats call accepts `{ weeks, companyId }`.

`src/pages/recruiter/Dashboard.jsx` re-exports `DashboardPage as Dashboard`.

Related i18n keys: `dash.filter.*`, `dash.company.selected`, `dash.activity.subFiltered`.
Related shared styling: `.filterctl` in `src/styles/pages.css`.
