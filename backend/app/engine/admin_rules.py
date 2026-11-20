"""T8.3 - ECA reactions of the IT_Admin rules.

R11  at-trigger A.CheckCompany(C) : C.FakePostingsCount >= 3  ->  C.Blacklisted(1)
R12  at-trigger P.Insert(Infos)   : C.Blacklisted = 1         ->  P.Status("F") and P.RiskScore(100)

The caller owns the transaction (nothing is committed here).
"""
from ..services import company_service, posting_service
from .evaluator import PostingContext, evaluate


def check_company(conn, rules, company_id):
    """A.CheckCompany: blacklist the company if a CheckCompany rule (R11) fires."""
    company = company_service.get_company(conn, company_id)            # 404 if missing
    ctx = PostingContext(conn, None, company_id)                        # only C is read
    fired = [r for r in evaluate(rules, ctx, trigger="CheckCompany").fired
             if r.set_blacklisted is not None]
    now = company["blacklisted"]
    for rule in fired:
        if now != rule.set_blacklisted:
            conn.update("UPDATE company SET blacklisted = %s WHERE company_id = %s",
                        (rule.set_blacklisted, company_id))
            now = rule.set_blacklisted
    return {"company_id": company_id, "name": company["name"],
            "fake_postings_count": company["fake_postings_count"],
            "fired_rules": [r.id for r in fired],
            "was_blacklisted": bool(company["blacklisted"]),
            "blacklisted": bool(now),
            "changed": now != company["blacklisted"]}


def apply_insert_rules(conn, rules, posting_id, company_id):
    """P.Insert: reject the new posting if an Insert rule (R12) fires. Returns the rule or None."""
    ctx = PostingContext(conn, posting_id, company_id)
    decision = evaluate(rules, ctx, trigger="Insert").decision
    if decision is None:
        return None
    posting_service.set_status(conn, posting_id, decision.status, decision.risk_score)
    conn.insert("INSERT INTO classification_result (posting_id, recruiter_id, label, score, rule_id) "
                "VALUES (%s, %s, %s, %s, %s)",
                (posting_id, None, decision.status, decision.risk_score, decision.id))
    return decision
