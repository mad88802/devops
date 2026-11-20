# T6.1 Candidate and Report services
Branch: `T6.1-candidate-report-services`

| Endpoint | Function |
|---|---|
| POST /api/postings/<id>/reports  body `{"candidate_id": n, "reason": 1-4}` | candidate_service.report_posting = **Cd.Report(P, Reason)**, the at-trigger of R9/R10 |
| GET  /api/postings/<id>/reports  | report_service.list_reports (+ count) |
| GET  /api/candidates/<id>        | candidate_service.get_candidate |

- report_service.count_reports = **Rp.CountReports(P)**.
- Report + rule reaction (R9/R10) + queue entry are saved in ONE transaction (rollback on any error).
- 201 returns the report, report_count, new status/risk_score, fired_rules, escalated, escalation.
- 404 unknown posting/candidate - 409 same candidate reports the same posting twice (UNIQUE posting+candidate) - 422 bad body (all errors at once).
- errors.py : adds ConflictError. app/__init__.py : registers the report routes, 409 handler.
- ASSUMPTION: the brief does not define the report reasons. Convention used: 1 fee requested, 2 fake/misleading, 3 personal data requested, 4 other (schema allows 1..4).
Depends on: T6.2 (engine.reactions) and T6.3 (escalation_service) - merge the three branches together.
