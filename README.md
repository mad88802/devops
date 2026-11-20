# T6.2 Implement rules R9 and R10
Branch: `T6.2-rules-r9-r10`

Appendix A.6, at-trigger **Cd.Report**:

| Rule | Under | Acting |
|---|---|---|
| R9 Escalate_Reported_Posting  | Rp.CountReports >= 3 and P.Status != 'F' | P.Status("S") + R.ToCheck(P) -> queue, priority normal |
| R10 Raise_Risk_On_Many_Reports | Rp.CountReports >= 5 | P.RiskScore(+20, max 100) + R.ToCheck(P) -> queue, priority high |

- rules.json : R1-R8 unchanged + R9, R10 (`at_trigger: "Report"`, acting = status / risk_delta / escalate).
- repository.py : new participants P (Status, RiskScore) and Rp (CountReports), text codes in conditions (`P.Status != 'F'`), trigger "Report", validation of the new acting fields. ToCheck rules load exactly as before.
- evaluator.py : PostingContext can read P and Rp.
- reactions.py : apply_report_rules - applies EVERY matching Report rule (R9 and R10 do different things), conditions evaluated first, then actions; writes a classification_result row (no recruiter) only when status/risk really changed.
Interpretation: `R.ToCheck(P)` = "ask a recruiter to re-check" (queue entry). Re-running R1-R8 automatically would let R8 undo R9 on a verified company.
Literal spec: R10 uses ">= 5", so every report after the 5th adds another +20 (capped at 100). R9 changes only the status, not the risk score.
