# T6.3 Escalation queue for recruiters
Branch: `T6.3-escalation-queue`

| Endpoint | Function |
|---|---|
| GET /api/escalations                    | open queue: high priority first, then most reports, then oldest |
| GET /api/escalations?include=resolved   | also closed entries (listed after the open ones) |
| GET /api/escalations/<id>               | one entry |

Item: escalation_id, posting_id, title, company_name, status, risk_score, priority, rule_id, report_count, created_at, resolved_at, resolved_by.

- database/schema.sql : adds table `escalation` (+ DROP before classification_result and an index). One OPEN row per posting; a new report updates it (priority can only go up).
  For an existing database run only the CREATE TABLE / CREATE INDEX part.
- services/escalation_service.py : enqueue, resolve_for_posting, list_queue, get_escalation.
- services/tocheck_service.py (T3.3 file, 2 small edits): a recruiter's ToCheck closes the posting's open entry in the same transaction.
- app/__init__.py : final version (T6.1 + escalation routes) - replaces the T6.1 copy.
