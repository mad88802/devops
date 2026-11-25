"""T3.3 - ToCheck orchestration and status update (Recruiter_Intf.ToCheck).

Flow: load the posting -> let the engine evaluate rules R1..R8 through the getter
services -> if a rule fires, update status/risk score and write the decision to the
history, in ONE transaction. If no rule fires the posting is left untouched (a new
posting stays Pending 'P' for manual review).
"""
from ..engine.evaluator import PostingContext, evaluate
from ..errors import ValidationError
from . import posting_service


def _recruiter_exists(conn, recruiter_id):
    return conn.fetch_one("SELECT 1 AS ok FROM recruiter WHERE recruiter_id = %s",
                          (recruiter_id,)) is not None


def to_check(conn, posting_id, rules, recruiter_id=None):
    if recruiter_id is not None:
        if (not isinstance(recruiter_id, int) or isinstance(recruiter_id, bool)
                or recruiter_id < 1):
            raise ValidationError([{"field": "recruiter_id",
                                    "message": "must be a positive integer"}])
        if not _recruiter_exists(conn, recruiter_id):
            raise ValidationError([{"field": "recruiter_id",
                                    "message": "recruiter does not exist"}])

    posting = posting_service.get_posting(conn, posting_id)          # 404 if missing
    ctx = PostingContext(conn, posting_id, posting["company_id"])
    result = evaluate(rules, ctx, trigger="ToCheck")
    matched = [r.id for r in result.fired]
    decision = result.decision

    if decision is None:
        return {
            "posting_id": posting_id, "updated": False,
            "status": posting["status"], "risk_score": posting["risk_score"],
            "rule_id": None, "rule_name": None,
            "matched_rules": [], "missing_indicators": result.missing,
            "message": "no rule fired: the posting is left unchanged "
                       "(a new posting stays Pending for manual review)",
        }

    try:
        posting_service.set_status(conn, posting_id, decision.status, decision.risk_score)
        conn.insert(
            "INSERT INTO classification_result "
            "(posting_id, recruiter_id, label, score, rule_id) VALUES (%s, %s, %s, %s, %s)",
            (posting_id, recruiter_id, decision.status, decision.risk_score, decision.id))
        conn.commit()
    except Exception:
        conn.rollback()
        raise

    return {
        "posting_id": posting_id, "updated": True,
        "previous_status": posting["status"],
        "status": decision.status, "risk_score": decision.risk_score,
        "rule_id": decision.id, "rule_name": decision.name,
        "matched_rules": matched, "missing_indicators": result.missing,
        "message": f"rule {decision.id} ({decision.name}) classified the posting "
                   f"{decision.status} with risk score {decision.risk_score}",
    }
