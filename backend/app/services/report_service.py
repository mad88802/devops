"""T6.1 - Report service (Report_Intf): add, list, CountReports.

Report reasons are not defined in the brief; the codes below are OUR convention
(the schema only constrains them to 1..4 and the seed data uses all four).
"""
from ..errors import NotFoundError, ValidationError
from ._util import clean_row

REASONS = {1: "fee_requested", 2: "fake_or_misleading", 3: "personal_data_requested", 4: "other"}
_FIELDS = {"candidate_id", "reason"}


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def validate_report(payload):
    """Return a clean {candidate_id, reason} or raise ValidationError (all problems at once)."""
    problems = []
    if not isinstance(payload, dict):
        raise ValidationError([{"field": "body", "message": "must be a JSON object"}])
    for k in payload:
        if k not in _FIELDS:
            problems.append({"field": k, "message": "unknown field"})
    cid = payload.get("candidate_id")
    if not _is_int(cid) or cid < 1:
        problems.append({"field": "candidate_id", "message": "must be a positive integer"})
    reason = payload.get("reason")
    if not _is_int(reason) or reason not in REASONS:
        problems.append({"field": "reason", "message":
                         "must be an integer code: " + ", ".join(f"{k} {v}" for k, v in REASONS.items())})
    if problems:
        raise ValidationError(problems)
    return {"candidate_id": cid, "reason": reason}


def _report_dict(row):
    out = clean_row(row, ("report_date",))
    out["reason_label"] = REASONS.get(out["reason"])
    return out


def add_report(conn, posting_id, candidate_id, reason):
    """Insert one report; the caller commits (so rules can react in the same transaction)."""
    return conn.insert("INSERT INTO report (posting_id, candidate_id, reason) VALUES (%s, %s, %s)",
                       (posting_id, candidate_id, reason))


def already_reported(conn, posting_id, candidate_id):
    return conn.fetch_one("SELECT 1 AS ok FROM report WHERE posting_id = %s AND candidate_id = %s",
                          (posting_id, candidate_id)) is not None


def get_report(conn, report_id):
    row = conn.fetch_one("SELECT * FROM report WHERE report_id = %s", (report_id,))
    if row is None:
        raise NotFoundError(f"report {report_id} not found")
    return _report_dict(row)


def list_reports(conn, posting_id):
    rows = conn.fetch_all("SELECT * FROM report WHERE posting_id = %s ORDER BY report_id", (posting_id,))
    return [_report_dict(r) for r in rows]


def count_reports(conn, posting_id):
    """Rp.CountReports(P)"""
    return conn.fetch_one("SELECT COUNT(*) AS n FROM report WHERE posting_id = %s",
                          (posting_id,))["n"]
