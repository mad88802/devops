"""T8.1 - Admin CRUD for companies (Admin_Intf, managing Company_Intf).

The read side used by the rule engine stays in company_service (T2.3); this module
is the IT_Admin's management side. There is no login in the project, so the
"admin" is not authenticated here (see README).
"""
from ..errors import NotFoundError, ValidationError
from . import company_service

INT_MAX = 2_147_483_647
_TEXT = {"name": 100, "country": 50, "industry": 50}
_COUNTS = ("age_years", "postings_last_24h", "fake_postings_count")
_FLAGS = ("has_profile", "website_verified", "blacklisted")
FIELDS = set(_TEXT) | set(_COUNTS) | set(_FLAGS) | {"admin_id"}
_DEFAULTS = {"country": None, "industry": None, "age_years": 0, "has_profile": 0,
             "website_verified": 0, "postings_last_24h": 0, "fake_postings_count": 0,
             "blacklisted": 0, "admin_id": None}


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def validate_company(conn, payload, partial):
    """Return the clean fields. partial=True (update): only the given fields, at least one."""
    if not isinstance(payload, dict):
        raise ValidationError([{"field": "body", "message": "must be a JSON object"}])
    problems = [{"field": k, "message": "unknown field"} for k in payload if k not in FIELDS]
    clean = {}
    for k, limit in _TEXT.items():
        if k not in payload:
            if k == "name" and not partial:
                problems.append({"field": k, "message": "is required"})
            continue
        v = payload[k]
        if v is None and k != "name":
            clean[k] = None
        elif not isinstance(v, str) or not v.strip() or len(v.strip()) > limit:
            problems.append({"field": k, "message": f"must be a text of 1 to {limit} characters"
                             + ("" if k == "name" else " or null")})
        else:
            clean[k] = v.strip()
    for k in _COUNTS:
        if k in payload:
            v = payload[k]
            if not _is_int(v) or not 0 <= v <= INT_MAX:
                problems.append({"field": k, "message": "must be an integer >= 0"})
            else:
                clean[k] = v
    for k in _FLAGS:
        if k in payload:
            v = payload[k]
            if not _is_int(v) or v not in (0, 1):
                problems.append({"field": k, "message": "must be 0 (no) or 1 (yes)"})
            else:
                clean[k] = v
    if "admin_id" in payload:
        v = payload["admin_id"]
        if v is None:
            clean["admin_id"] = None
        elif not _is_int(v) or v < 1:
            problems.append({"field": "admin_id", "message": "must be a positive integer or null"})
        elif conn.fetch_one("SELECT 1 AS ok FROM it_admin WHERE admin_id = %s", (v,)) is None:
            problems.append({"field": "admin_id", "message": "IT admin does not exist"})
        else:
            clean["admin_id"] = v
    if partial and not payload and not problems:
        problems.append({"field": "body", "message": "give at least one field to update"})
    if problems:
        raise ValidationError(problems)
    return clean


def create_company(conn, payload):
    data = {**_DEFAULTS, **validate_company(conn, payload, partial=False)}
    names = ["name"] + [k for k in _DEFAULTS]
    try:
        company_id = conn.insert(
            f"INSERT INTO company ({', '.join(names)}) VALUES ({', '.join(['%s'] * len(names))})",
            [data[k] for k in names])
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return company_service.get_company(conn, company_id)


def list_companies(conn, blacklisted=None, search=None):
    sql, params = "SELECT * FROM company", []
    where = []
    if blacklisted is not None:
        where.append("blacklisted = %s")
        params.append(blacklisted)
    if search:
        where.append("LOWER(name) LIKE %s")
        params.append("%" + search.lower() + "%")
    if where:
        sql += " WHERE " + " AND ".join(where)
    return conn.fetch_all(sql + " ORDER BY company_id", params)


def update_company(conn, company_id, payload):
    company_service.get_company(conn, company_id)                  # 404 if missing
    data = validate_company(conn, payload, partial=True)
    try:
        sets = ", ".join(f"{k} = %s" for k in data)
        conn.update(f"UPDATE company SET {sets} WHERE company_id = %s", list(data.values()) + [company_id])
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return company_service.get_company(conn, company_id)


def delete_company(conn, company_id):
    """Also removes the company's postings (ON DELETE CASCADE): indicators, reports, history."""
    try:
        n = conn.delete("DELETE FROM company WHERE company_id = %s", (company_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    if n == 0:
        raise NotFoundError(f"company {company_id} not found")
