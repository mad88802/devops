# T5.3 — Status badges and risk score display

Primary code for the verdict badge and the 0–100 risk ruler.

| File | Purpose |
|---|---|
| `statusMeta.js` | `STATUS_META`, `STATUS_ORDER` and `riskBand()` |
| `StatusBadge.jsx` | `StatusBadge` and `StatusDot` |
| `RiskRuler.jsx` | The risk ruler used on the result page, form preview, inbox, candidate view and dashboard |

Existing import paths remain valid through shims:

- `src/components/Status.jsx` → `T5.3/StatusBadge.jsx`
- `src/components/Risk.jsx` → `T5.3/RiskRuler.jsx`
- `shared/fields.js` re-exports the status/risk metadata.

Related shared styling: `.status` and `.risk` blocks in `src/styles/app.css`.
