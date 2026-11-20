"""T6.2 - ECA reaction to Cd.Report (rules R9 and R10).

Unlike R.ToCheck (best single rule wins), EVERY rule of the Report trigger that
matches is applied, because R9 and R10 do different things:
  R9  : P.Status("S")                  + R.ToCheck(P)
  R10 : P.RiskScore(P.RiskScore + 20)  + R.ToCheck(P) with high priority
All conditions are evaluated first on the state seen after the new report, then the
actions are applied (so R9 and R10 never see each other's changes).
R.ToCheck(P) means "ask a recruiter to re-check": the posting goes to the escalation
queue (T6.3); the recruiter runs ToCheck (US3), which closes the queue entry.
The caller owns the transaction (nothing is committed here).
"""
from ..services import escalation_service, posting_service, report_service
from .evaluator import PostingContext, evaluate

_PRIORITY_RANK = {"normal": 0, "high": 1}


def _history(conn, posting_id, rule_id, status, score):
    """Audit row in classification_result (no recruiter: the decision is automatic)."""
    conn.insert("INSERT INTO classification_result (posting_id, recruiter_id, label, score, rule_id) "
                "VALUES (%s, %s, %s, %s, %s)", (posting_id, None, status, score, rule_id))


def apply_report_rules(conn, rules, posting_id):
    posting = posting_service.get_posting(conn, posting_id)
    ctx = PostingContext(conn, posting_id, posting["company_id"])
    fired = sorted(evaluate(rules, ctx, trigger="Report").fired, key=lambda r: int(r.id[1:]))

    status, risk = posting["status"], posting["risk_score"]
    cur_status, cur_risk = status, risk
    priority = None
    for rule in fired:
        if rule.status is not None:
            status = rule.status
        if rule.risk_delta:
            risk = max(0, min(100, risk + rule.risk_delta))
        if rule.escalate and (priority is None or
                              _PRIORITY_RANK[rule.escalate] > _PRIORITY_RANK[priority]):
            priority = rule.escalate
        if (status, risk) != (cur_status, cur_risk):          # act only on a real change
            posting_service.set_status(conn, posting_id, status, risk)
            if status != "P":                      # history only knows L, S and F
                _history(conn, posting_id, rule.id, status, risk)
            cur_status, cur_risk = status, risk

    escalation = None
    if priority is not None:
        top = max((r for r in fired if r.escalate), key=lambda r: (_PRIORITY_RANK[r.escalate], r.id))
        escalation = escalation_service.enqueue(
            conn, posting_id, top.id, priority, report_service.count_reports(conn, posting_id))
    return {"fired_rules": [r.id for r in fired], "escalation": escalation}
