from flask import Blueprint, current_app, jsonify, request

from ..db import get_db
from ..engine.repository import JsonRuleRepository
from ..services import stats_service

bp = Blueprint("stats", __name__)


def _parse_params():
    weeks = request.args.get("weeks")
    company_id = request.args.get("companyId") or request.args.get("company_id")
    return (
        int(weeks) if weeks and weeks.isdigit() else None,
        int(company_id) if company_id and company_id.isdigit() else None,
    )


@bp.get("/stats/summary")
def get_summary():
    weeks, company_id = _parse_params()
    return jsonify(stats_service.stats_summary(get_db(), weeks=weeks, company_id=company_id))


@bp.get("/stats/weekly")
def get_weekly():
    weeks, company_id = _parse_params()
    count = weeks if weeks else 9
    items = stats_service.stats_weekly(get_db(), weeks=count, company_id=company_id)
    return jsonify(items=items)


@bp.get("/stats/companies")
def get_companies():
    weeks, company_id = _parse_params()
    limit = request.args.get("limit", 8)
    items = stats_service.stats_by_company(get_db(), limit=int(limit), weeks=weeks, company_id=company_id)
    return jsonify(items=items)


@bp.get("/stats/rules")
def get_rules():
    weeks, company_id = _parse_params()
    items = stats_service.stats_by_rule(get_db(), weeks=weeks, company_id=company_id)
    return jsonify(items=items)


@bp.get("/stats/activity")
def get_activity():
    weeks, company_id = _parse_params()
    limit = request.args.get("limit", 8)
    items = stats_service.recent_activity(get_db(), limit=int(limit), weeks=weeks, company_id=company_id)
    return jsonify(items=items)


@bp.get("/classifications")
def get_classifications():
    limit = request.args.get("limit", 20)
    items = stats_service.recent_activity(get_db(), limit=int(limit))
    return jsonify(items=items)


@bp.get("/rules")
def list_rules():
    """US9: Expose all ECA rules stored in repository/database."""
    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()
    rule_dicts = []
    for r in rules:
        rule_dicts.append({
            "id": r.id,
            "ruleId": r.id,
            "name": r.name,
            "trigger": r.trigger,
            "at_trigger": r.trigger,
            "status": r.status,
            "riskScore": r.risk_score,
            "riskDelta": r.risk_delta,
            "escalate": r.escalate,
            "blacklisted": r.set_blacklisted,
            "conditions": [str(c) for c in r.conditions],
        })
    return jsonify(items=rule_dicts, count=len(rule_dicts))


@bp.post("/dev/reset")
def reset_db():
    from ..init_db import init_sqlite
    init_sqlite()
    return jsonify(ok=True)
