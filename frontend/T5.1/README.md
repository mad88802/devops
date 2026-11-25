# T5.1 — Result page UI

Primary code for the posting result / case-file page.

| File | Purpose |
|---|---|
| `PostingDetail.jsx` | Recruiter result page: header, verdict, indicator dossier, rule/history/report tabs, override and delete actions |
| `PostingView.jsx` | Candidate-facing result view with the report action |

Dependencies:

- `T5.2/RuleCard.jsx`, `T5.2/ConditionLedger.jsx`, `T5.2/rules.js` — fired rule and explanation.
- `T5.3/StatusBadge.jsx`, `T5.3/RiskRuler.jsx` — verdict badge and risk ruler.
- `T7.3/ReportDialog.jsx` — candidate report action.

Existing import paths remain valid through shims:

- `src/pages/recruiter/PostingDetail.jsx` → `T5.1/PostingDetail.jsx`
- `src/pages/candidate/PostingView.jsx` → `T5.1/PostingView.jsx`

Related shared styling: `.posthead`, `.casegrid`, `.verdict` in `src/styles/pages.css` and `app.css`.
Related i18n keys: `detail.*`, `view.*`.
