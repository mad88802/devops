# T5.2 — Display fired rule and explanation

Primary code for the rule trace shown on the posting result page.

| File | Purpose |
|---|---|
| `rules.js` | R1–R12 repository, `evaluateCheck()`, report/company/insert event evaluators |
| `RuleCard.jsx` | One rule with its condition pips and fired/muted states |
| `ConditionLedger.jsx` | `ConditionLedger` (expected vs actual, pass/fail) and `ActionTokens` |

Existing import paths remain valid through shims:

- `shared/rules.js` → `T5.2/rules.js`
- `src/components/RuleCard.jsx` → `T5.2/RuleCard.jsx`
- `src/components/Ledger.jsx` → `T5.2/ConditionLedger.jsx`

Related shared styling: `.ledger` and `.rule` blocks in `src/styles/app.css`.
Related i18n keys: `detail.*`, `rule.*`.
