# T8.3 Implement rules R11 and R12 (blacklist)
Branch: `T8.3-rules-r11-r12`

Appendix A.6, IT_Admin rules:

| Rule | At-trigger | Under | Acting |
|---|---|---|---|
| R11 Blacklist_Repeat_Offender | A.CheckCompany(C) | C.FakePostingsCount >= 3 | C.Blacklisted(1) |
| R12 Reject_Blacklisted_Company | P.Insert(Infos) | C.Blacklisted = 1 | P.Status("F") and P.RiskScore(100) |

- rules.json : R1-R10 unchanged + R11, R12. repository.py : new triggers `CheckCompany` and `Insert`, acting `blacklisted` (0/1).
- engine/admin_rules.py : `check_company` (R11) and `apply_insert_rules` (R12; also writes a classification_result row, no recruiter - like seed posting 5).
- POST /api/admin/companies/<id>/check : run R11 on one company (returns fired_rules, changed).
- POST /api/admin/companies/check : run R11 on every company that is not blacklisted yet, one transaction.
- R12 runs INSIDE POST /api/postings (same transaction): a posting of a blacklisted company is stored as F / 100. posting_service.py (T2.1) and posting_routes.py (T2.1) get a small change (`rules=` argument).
- app/__init__.py : final version (US6 + T8.1 + T8.2 + blacklist routes).
Limits (not in the brief): fake_postings_count is a stored value; nothing increments it automatically when ToCheck labels a posting F.
A later ToCheck (R1-R8) can still re-classify a posting that R12 rejected.
