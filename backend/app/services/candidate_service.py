"""T6.1 - Candidate service (Candidate_Intf): Display_Candidate and Cd.Report.

Cd.Report(P, Reason) is the AT-TRIGGER of rules R9 and R10 (Appendix A.6):
store the report, then let the ECA engine react to it, all in ONE transaction.
"""
from ..engine import reactions
from ..errors import ConflictError, NotFoundError
from . import posting_service, report_service


def get_candidate(conn, candidate_id):
    row = conn.fetch_one("SELECT * FROM candidate WHERE candidate_id = %s", (candidate_id,))
    if row is None:
        raise NotFoundError(f"candidate {candidate_id} not found")
    return row


def candidate_exists(conn, candidate_id):
    return conn.fetch_one("SELECT 1 AS ok FROM candidate WHERE candidate_id = %s",
                          (candidate_id,)) is not None


def report_posting(conn, posting_id, payload, rules):
    """Cd.Report: a candidate reports a posting, rules R9/R10 may escalate it."""
    data = report_service.validate_report(payload)
    posting_service.get_posting(conn, posting_id)                 # 404 if missing
    if not candidate_exists(conn, data["candidate_id"]):
        raise NotFoundError(f"candidate {data['candidate_id']} not found")
    if report_service.already_reported(conn, posting_id, data["candidate_id"]):
        raise ConflictError("this candidate has already reported this posting")

    try:
        report_id = report_service.add_report(conn, posting_id, data["candidate_id"], data["reason"])
        outcome = reactions.apply_report_rules(conn, rules, posting_id)    # T6.2 (+ T6.3 queue)
        conn.commit()
    except Exception:
        conn.rollback()
        raise

    posting = posting_service.get_posting(conn, posting_id)
    return {
        "report": report_service.get_report(conn, report_id),
        "report_count": report_service.count_reports(conn, posting_id),
        "status": posting["status"], "risk_score": posting["risk_score"],
        "fired_rules": outcome["fired_rules"],
        "escalated": outcome["escalation"] is not None,
        "escalation": outcome["escalation"],
    }
