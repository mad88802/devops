# T4.3 — Connect form to Posting API

Primary code for turning form state into API requests.

| File | Purpose |
|---|---|
| `postingPayload.js` | `neutralise()`, `factsForPreview()` and `buildPayload()` |
| `postingApi.js` | `createPosting()` and `checkPosting()` client methods |
| `postingsRoutes.js` | Express routes for `POST /api/postings` and `POST /api/postings/:id/check` |

The form calls `api.postings.create()` then optionally `api.postings.check()`.
The server validates with `server/validate.js`, applies R12 and runs R1–R8.

`src/lib/postingPayload.js` re-exports the payload builders; `src/api/client.js`
exposes the API methods as `api.postings`.

Related i18n keys: `form.*`, `toast.*`, `error.*`.
