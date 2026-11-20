# T8.2 Admin CRUD for recruiters
Branch: `T8.2-admin-crud-recruiters`

| Endpoint | Action |
|---|---|
| POST   /api/admin/recruiters | create. name, surname, email required; role 'R' (default) or 'S'; admin_id optional |
| GET    /api/admin/recruiters | list, filter `?role=R` or `?role=S` |
| GET    /api/admin/recruiters/<id> | read one |
| PATCH or PUT /api/admin/recruiters/<id> | partial update |
| DELETE /api/admin/recruiters/<id> | 204. History is kept: classification_result.recruiter_id / escalation.resolved_by become NULL |

Email: valid format, unique (case-insensitive) -> 409 if already used. 422 for bad fields (all reported together), 404 unknown id.
The brief does not name the roles; codes follow the schema ('R', 'S').
app/__init__.py : adds the recruiter routes to the T8.1 version.
