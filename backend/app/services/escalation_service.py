"""T6.3 - Escalation queue for recruiters.

R.ToCheck(P) requested by rules R9/R10 (at-trigger Cd.Report) is stored here.
Queue order: high priority first, then most reports, then oldest first.
"""
from datetime import datetime

from ..errors import NotFoundError
from ._util import clean_row

_RANK = {"normal": 0, "high": 1}


def _ts(value):
    """MySQL returns datetime objects, SQLite strings."""
    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="seconds")
    return value


def _row(row):
    out = clean_row(row)
    for k in ("created_at", "resolved_at"):
        if k in out:
            out[k] = _ts(out[k])
    return out


def get_open(conn, posting_id):
    return conn.fetch_one("SELECT * FROM escalation WHERE posting_id = %s AND resolved_at IS NULL",
                          (posting_id,))


def enqueue(conn, posting_id, rule_id, priority, report_count):
    """Add the posting to the queue, or update its open entry (never two open rows).

    The priority can only go up (a later R9 never lowers an R10 escalation).
    Does not commit: the caller commits it together with the report and rule actions.
    """
    open_row = get_open(conn, posting_id)
    if open_row is None:
        eid = conn.insert("INSERT INTO escalation (posting_id, rule_id, priority, report_count) "
                          "VALUES (%s, %s, %s, %s)", (posting_id, rule_id, priority, report_count))
    else:
        eid = open_row["escalation_id"]
        if _RANK[open_row["priority"]] > _RANK[priority]:
            priority, rule_id = open_row["priority"], open_row["rule_id"]
        conn.update("UPDATE escalation SET rule_id = %s, priority = %s, report_count = %s "
                    "WHERE escalation_id = %s", (rule_id, priority, report_count, eid))
    return {"escalation_id": eid, "posting_id": posting_id, "rule_id": rule_id,
            "priority": priority, "report_count": report_count}


def resolve_for_posting(conn, posting_id, recruiter_id=None):
    """A recruiter ran ToCheck on the posting: close its open entry. Does not commit."""
    return conn.update("UPDATE escalation SET resolved_at = CURRENT_TIMESTAMP, resolved_by = %s "
                       "WHERE posting_id = %s AND resolved_at IS NULL", (recruiter_id, posting_id))


_SELECT = ("SELECT e.escalation_id, e.posting_id, p.title, c.name AS company_name, "
           "p.status, p.risk_score, e.priority, e.rule_id, e.report_count, "
           "e.created_at, e.resolved_at, e.resolved_by "
           "FROM escalation e JOIN job_posting p ON p.posting_id = e.posting_id "
           "JOIN company c ON c.company_id = p.company_id ")


def list_queue(conn, include_resolved=False):
    """The recruiters' queue (open entries only, unless include_resolved)."""
    where = "" if include_resolved else "WHERE e.resolved_at IS NULL "
    rows = conn.fetch_all(_SELECT + where +
                          "ORDER BY (e.resolved_at IS NOT NULL), "
                          "CASE e.priority WHEN 'high' THEN 0 ELSE 1 END, "
                          "e.report_count DESC, e.created_at ASC, e.escalation_id ASC")
    return [_row(r) for r in rows]


def get_escalation(conn, escalation_id):
    row = conn.fetch_one(_SELECT + "WHERE e.escalation_id = %s", (escalation_id,))
    if row is None:
        raise NotFoundError(f"escalation {escalation_id} not found")
    return _row(row)
