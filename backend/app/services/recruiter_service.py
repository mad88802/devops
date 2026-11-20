"""T8.2 - Admin CRUD for recruiters (Admin_Intf, managing Recruiter_Intf).

role codes follow the schema: 'R' and 'S' (the brief does not name them; the seed has
one of each). Deleting a recruiter keeps the history: classification_result.recruiter_id
and escalation.resolved_by become NULL (ON DELETE SET NULL).
"""
import re

from ..errors import ConflictError, NotFoundError, ValidationError

ROLES = ("R", "S")
FIELDS = {"name", "surname", "email", "role", "admin_id"}
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_DEFAULT_ROLE = "R"


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def validate_recruiter(conn, payload, partial):
    if not isinstance(payload, dict):
        raise ValidationError([{"field": "body", "message": "must be a JSON object"}])
    problems = [{"field": k, "message": "unknown field"} for k in payload if k not in FIELDS]
    clean = {}
    for k in ("name", "surname", "email"):
        if k not in payload:
            if not partial:
                problems.append({"field": k, "message": "is required"})
            continue
        v = payload[k]
        if not isinstance(v, str) or not v.strip() or len(v.strip()) > 100:
            problems.append({"field": k, "message": "must be a text of 1 to 100 characters"})
        elif k == "email" and not _EMAIL_RE.match(v.strip()):
            problems.append({"field": k, "message": "must be a valid email address"})
        else:
            clean[k] = v.strip()
    if "role" in payload:
        if payload["role"] not in ROLES:
            problems.append({"field": "role", "message": "must be one of " + ", ".join(ROLES)})
        else:
            clean["role"] = payload["role"]
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


def get_recruiter(conn, recruiter_id):
    row = conn.fetch_one("SELECT * FROM recruiter WHERE recruiter_id = %s", (recruiter_id,))
    if row is None:
        raise NotFoundError(f"recruiter {recruiter_id} not found")
    return row


def _email_taken(conn, email, except_id=None):
    row = conn.fetch_one("SELECT recruiter_id FROM recruiter WHERE LOWER(email) = %s",
                         (email.lower(),))
    return row is not None and row["recruiter_id"] != except_id


def create_recruiter(conn, payload):
    data = {"role": _DEFAULT_ROLE, "admin_id": None, **validate_recruiter(conn, payload, partial=False)}
    if _email_taken(conn, data["email"]):
        raise ConflictError(f"a recruiter with email {data['email']} already exists")
    try:
        rid = conn.insert("INSERT INTO recruiter (name, surname, email, role, admin_id) "
                          "VALUES (%s, %s, %s, %s, %s)",
                          (data["name"], data["surname"], data["email"], data["role"], data["admin_id"]))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return get_recruiter(conn, rid)


def list_recruiters(conn, role=None):
    if role:
        return conn.fetch_all("SELECT * FROM recruiter WHERE role = %s ORDER BY recruiter_id", (role,))
    return conn.fetch_all("SELECT * FROM recruiter ORDER BY recruiter_id")


def update_recruiter(conn, recruiter_id, payload):
    get_recruiter(conn, recruiter_id)                              # 404 if missing
    data = validate_recruiter(conn, payload, partial=True)
    if "email" in data and _email_taken(conn, data["email"], except_id=recruiter_id):
        raise ConflictError(f"a recruiter with email {data['email']} already exists")
    try:
        sets = ", ".join(f"{k} = %s" for k in data)
        conn.update(f"UPDATE recruiter SET {sets} WHERE recruiter_id = %s",
                    list(data.values()) + [recruiter_id])
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return get_recruiter(conn, recruiter_id)


def delete_recruiter(conn, recruiter_id):
    try:
        n = conn.delete("DELETE FROM recruiter WHERE recruiter_id = %s", (recruiter_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    if n == 0:
        raise NotFoundError(f"recruiter {recruiter_id} not found")
