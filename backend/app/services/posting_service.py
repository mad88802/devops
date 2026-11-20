"""T2.1 - Posting service (Posting_Intf): Insert_Posting, Display_Posting, Remove_Posting."""
from datetime import date

from ..errors import NotFoundError, ValidationError
from ..validation import STATUSES, validate_posting
from . import company_service, indicator_service
from ._util import clean_row, to_iso

_POSTING_COLS = ("company_id", "title", "description", "location",
                 "employment_type", "posted_date")
_INDICATOR_TABLES = ("salary_indicators", "fee_indicators", "content_indicators")


def _age_days(posted_date):
    d = date.fromisoformat(to_iso(posted_date))
    return max(0, (date.today() - d).days)


def _posting_dict(row):
    out = clean_row(row, ("posted_date",))
    out["age_days"] = _age_days(out["posted_date"])      # JobPosting.Age_Days()
    return out


def insert_posting(conn, payload, rules=None):
    """Validate, then store the posting and its indicator rows in ONE transaction.

    A new posting always starts as status 'P' (Pending) with risk_score 0:
    only ToCheck (US3) changes them. With `rules` given, the P.Insert rules run in the
    same transaction (R12: a blacklisted company's posting is rejected as F / 100).
    """
    data = validate_posting(payload)
    if not company_service.company_exists(conn, data["company_id"]):
        raise ValidationError([{"field": "company_id", "message": "company does not exist"}])
    try:
        cols = ", ".join(_POSTING_COLS)
        marks = ", ".join(["%s"] * len(_POSTING_COLS))
        posting_id = conn.insert(
            f"INSERT INTO job_posting ({cols}) VALUES ({marks})",
            [data[c] for c in _POSTING_COLS])
        for table in _INDICATOR_TABLES:
            block = data[table]
            if block is None:
                continue
            names = ["posting_id"] + list(block)
            conn.insert(
                f"INSERT INTO {table} ({', '.join(names)}) "
                f"VALUES ({', '.join(['%s'] * len(names))})",
                [posting_id] + list(block.values()))
        if rules is not None:
            from ..engine import admin_rules          # local import: avoids a circular import
            admin_rules.apply_insert_rules(conn, rules, posting_id, data["company_id"])
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return display_posting(conn, posting_id)


def get_posting(conn, posting_id):
    """The bare job_posting row (no company, no indicators)."""
    row = conn.fetch_one("SELECT * FROM job_posting WHERE posting_id = %s", (posting_id,))
    if row is None:
        raise NotFoundError(f"posting {posting_id} not found")
    return row


def display_posting(conn, posting_id):
    out = _posting_dict(get_posting(conn, posting_id))
    out["company"] = company_service.get_company(conn, out["company_id"])
    out.update(indicator_service.find_indicators(conn, posting_id))
    return out


def remove_posting(conn, posting_id):
    """Delete a posting. Indicators, reports and classification history go with it
    (ON DELETE CASCADE)."""
    try:
        n = conn.delete("DELETE FROM job_posting WHERE posting_id = %s", (posting_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    if n == 0:
        raise NotFoundError(f"posting {posting_id} not found")


def set_status(conn, posting_id, status, risk_score):
    """JobPosting.Set_Status: update status and risk score.

    Does not commit: the caller (ToCheck) commits it together with the
    classification history row, so both succeed or both are undone.
    """
    problems = []
    if status not in STATUSES:
        problems.append({"field": "status", "message": "must be one of " + ", ".join(STATUSES)})
    if not isinstance(risk_score, int) or isinstance(risk_score, bool) or not 0 <= risk_score <= 100:
        problems.append({"field": "risk_score", "message": "must be an integer from 0 to 100"})
    if problems:
        raise ValidationError(problems)
    conn.update("UPDATE job_posting SET status = %s, risk_score = %s WHERE posting_id = %s",
                (status, risk_score, posting_id))
