# T4.1 — Posting form UI

Primary code for the recruiter posting form.

| File | Purpose |
|---|---|
| `PostingForm.jsx` | The page: sectioned form, company selector, validation feedback, live rule preview |
| `FormField.jsx` | `FormField`, `FieldControl` and `Segmented` coded-value controls |
| `fields.js` | `FIELD_GROUPS`, `FIELD_INDEX`, `POSTING_INPUT_FIELDS`, defaults and field helpers |

Dependencies:

- `T4.2/postingValidation.js` — client-side validation.
- `T4.3/postingPayload.js` + `T4.3/postingApi.js` — payload building and save/check calls.
- `T5.2/rules.js` — live R1–R8 preview.
- `T5.3/RiskRuler.jsx` — preview risk score.

Existing import paths remain valid through shims:

- `src/pages/recruiter/PostingForm.jsx` → `T4.1/PostingForm.jsx`
- `src/components/Field.jsx` → `T4.1/FormField.jsx`
- `shared/fields.js` re-exports the field catalogue.

Related shared styling: `.formgrid`, `.formsection`, `.preview` in `src/styles/pages.css`; inputs in `src/styles/app.css`.
Related i18n keys: `form.*`, `field.*`, `group.*`, `opt.*`, `error.*`.
