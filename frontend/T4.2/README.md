# T4.2 — Client-side validation

Primary code for immediate form feedback.

| File | Purpose |
|---|---|
| `postingValidation.js` | `validatePostingValues()` — required, coded, number, date, max-length and cross-field salary checks |

The server repeats every check in `server/validate.js` and remains
authoritative. `src/lib/postingPayload.js` re-exports the validation function so
the form keeps one stable import.

Related i18n keys: `error.*`.
Consumed by `T4.1/PostingForm.jsx` and `T4.1/FormField.jsx` (the `error` prop).
