# T8.1 Admin CRUD for companies
Branch: `T8.1-admin-crud-companies`

| Endpoint | Action |
|---|---|
| POST   /api/admin/companies | create (201 + Location). `name` required; other fields default as in the schema |
| GET    /api/admin/companies | list. Filters: `?blacklisted=0/1`, `?q=text` (name contains) |
| GET    /api/admin/companies/<id> | read one |
| PATCH or PUT /api/admin/companies/<id> | partial update: only the fields sent change (>= 1 field) |
| DELETE /api/admin/companies/<id> | 204. Also deletes the company's postings (cascade: indicators, reports, history, queue) |

Fields: name (<=100), country (<=50), industry (<=50), age_years, postings_last_24h, fake_postings_count (integers >= 0),
has_profile, website_verified, blacklisted (0/1), admin_id (existing IT admin or null).
Errors: 422 with all problems at once, 404 unknown id, 400 body not a JSON object.
The existing GET /api/companies/<id> getter (T2.3) is untouched; this is the admin side.
No login exists in the project, so these endpoints are not authenticated.
app/__init__.py : registers the admin company routes (builds on the US6 version).
