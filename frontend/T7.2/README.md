# T7.2 — Filter by status

Primary code for the status chips on the posting list.

| File | Purpose |
|---|---|
| `StatusFilter.jsx` | Controlled chip row: All + P / S / L / F, optional counts |
| `parseStatus.js` | Parses `?status=P,S` into valid status codes for the server query |

Used by:

- `T7.1/Inbox.jsx` — recruiter list with counts from the summary.
- `T7.1/Browse.jsx` — candidate list with the candidate order `F, S, L, P`.
- `server/store.js#listPostings` — server-side status filtering.

Related i18n keys: `status.*`, `common.all`.
Related shared styling: `.chips`, `.chip` in `src/styles/app.css`.
