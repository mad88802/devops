from flask import Blueprint, current_app, jsonify

from ..db import get_db
from ..engine import admin_rules
from ..engine.repository import JsonRuleRepository
from ..services import admin_company_service

bp = Blueprint("admin_blacklist", __name__)


def _rules():
    return JsonRuleRepository(current_app.config["RULES_PATH"]).load()     # reloaded per call


@bp.post("/admin/companies/<int:company_id>/check")
def check_company(company_id):
    """A.CheckCompany(C): rule R11 blacklists the company if it has >= 3 fake postings."""
    conn = get_db()
    try:
        outcome = admin_rules.check_company(conn, _rules(), company_id)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return jsonify(outcome)


@bp.post("/admin/companies/check")
def check_all_companies():
    """Run A.CheckCompany on every company that is not blacklisted yet (one transaction)."""
    conn, rules = get_db(), _rules()
    try:
        outcomes = [admin_rules.check_company(conn, rules, c["company_id"])
                    for c in admin_company_service.list_companies(conn, blacklisted=0)]
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    newly = [o for o in outcomes if o["changed"]]
    return jsonify(checked=len(outcomes), newly_blacklisted_count=len(newly),
                   newly_blacklisted=newly)
