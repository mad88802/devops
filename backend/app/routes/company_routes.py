from flask import Blueprint, current_app, jsonify, request, url_for

from ..db import get_db
from ..engine import admin_rules
from ..engine.repository import JsonRuleRepository
from ..services import admin_company_service, company_service

bp = Blueprint("companies", __name__)


def _to_camel_dict(d):
    if not isinstance(d, dict):
        return d
    res = {}
    for k, v in d.items():
        parts = k.split("_")
        camel_k = parts[0] + "".join(p.capitalize() for p in parts[1:])
        res[camel_k] = v
        res[k] = v
    res["id"] = d.get("company_id")
    return res


@bp.get("/companies")
def list_companies():
    flag = request.args.get("blacklisted")
    if flag not in (None, "", "0", "1"):
        return jsonify(error="bad_request", message="blacklisted must be 0 or 1"), 400
    b_val = None if (flag is None or flag == "") else int(flag)
    search = request.args.get("q", "").strip() or None
    items = admin_company_service.list_companies(get_db(), blacklisted=b_val, search=search)
    camel_items = [_to_camel_dict(c) for c in items]
    return jsonify(items=camel_items, count=len(items), companies=camel_items)


@bp.get("/companies/<int:company_id>")
def get_company(company_id):
    c = _to_camel_dict(company_service.get_company(get_db(), company_id))
    return jsonify(company=c, **c)


@bp.post("/companies")
def create_company():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request", message="body must be a JSON object"), 400
    comp = admin_company_service.create_company(get_db(), payload)
    c = _to_camel_dict(comp)
    resp = jsonify(company=c, **c)
    resp.status_code = 201
    return resp


@bp.put("/companies/<int:company_id>")
def update_company(company_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request", message="body must be a JSON object"), 400
    comp = admin_company_service.update_company(get_db(), company_id, payload)
    c = _to_camel_dict(comp)
    return jsonify(company=c, **c)


@bp.delete("/companies/<int:company_id>")
def delete_company(company_id):
    admin_company_service.delete_company(get_db(), company_id)
    return jsonify(ok=True)


@bp.post("/companies/<int:company_id>/check")
def check_company(company_id):
    """R11 Blacklist_Repeat_Offender check."""
    conn = get_db()
    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()
    outcome = admin_rules.check_company(conn, rules, company_id)
    conn.commit()
    return jsonify(outcome)


@bp.post("/companies/<int:company_id>/blacklist")
def blacklist_company(company_id):
    payload = request.get_json(silent=True) or {}
    val = payload.get("blacklisted", 1)
    comp = admin_company_service.update_company(get_db(), company_id, {"blacklisted": int(val)})
    c = _to_camel_dict(comp)
    return jsonify(company=c)
