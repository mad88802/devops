# T2.1 Posting service endpoints (Insert, Display, Remove)
Branch: `T2.1-posting-service-endpoints`

| Endpoint | Function (posting_service.py) |
|---|---|
| POST   /api/postings        | insert_posting (validate, one transaction, starts as status P / risk 0) |
| GET    /api/postings/<id>   | display_posting (posting + company + indicators + age_days) |
| DELETE /api/postings/<id>   | remove_posting (indicators/reports/history removed by ON DELETE CASCADE) |

Uses: validation.py (T2.2), company_service / indicator_service (T2.3).
posting_routes.py also holds the 3 indicator GET routes (T2.3).
