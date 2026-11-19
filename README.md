# T2.3 Company and indicator getter services
Branch: `T2.3-company-indicator-getters`

| Endpoint | Function |
|---|---|
| GET /api/companies/<id>          | company_service.get_company |
| GET /api/postings/<id>/salary    | indicator_service.get_salary  (Salary_Intf) |
| GET /api/postings/<id>/fee       | indicator_service.get_fee     (Fee_Intf) |
| GET /api/postings/<id>/content   | indicator_service.get_content (Content_Intf) |

Also company_exists() and find_indicators() (None instead of 404), used by Insert/Display and the rule engine.
The three indicator routes live in routes/posting_routes.py (shipped in T2.1).
