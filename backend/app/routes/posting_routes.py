from flask import Blueprint, current_app, jsonify, request, url_for

from ..db import get_db
from ..engine.repository import JsonRuleRepository
from ..services import indicator_service, posting_service

bp = Blueprint("postings", __name__)


@bp.get("/postings")
def list_postings():
    q = request.args.get("q")
    status = request.args.get("status")
    company_id = request.args.get("companyId") or request.args.get("company_id")
    min_risk = request.args.get("minRisk") or request.args.get("min_risk")
    sort = request.args.get("sort", "recent")
    page = request.args.get("page", 1)
    limit = request.args.get("limit", 10)
    pending_only = request.args.get("pendingOnly") in ("1", "true") or request.args.get("pending_only") in ("1", "true")

    res = posting_service.list_postings(
        get_db(),
        q=q,
        status=status,
        company_id=int(company_id) if company_id else None,
        min_risk=int(min_risk) if min_risk else None,
        sort=sort,
        page=int(page),
        limit=int(limit),
        pending_only=pending_only,
    )
    return jsonify(res)


@bp.post("/postings")
def insert_posting():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request",
                       message="body must be a JSON object (Content-Type: application/json)"), 400
    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()   # R12 runs at insert
    posting = posting_service.insert_posting(get_db(), payload, rules=rules)
    resp = jsonify(posting)
    resp.status_code = 201
    pid = posting.get("posting_id") or posting.get("id")
    resp.headers["Location"] = url_for("postings.display_posting", posting_id=pid)
    return resp


@bp.get("/postings/<int:posting_id>")
def display_posting(posting_id):
    return jsonify(posting_service.display_posting(get_db(), posting_id))


@bp.put("/postings/<int:posting_id>")
def update_posting(posting_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request", message="body must be a JSON object"), 400
    return jsonify(posting_service.update_posting(get_db(), posting_id, payload))


@bp.post("/postings/<int:posting_id>/override")
def override_posting(posting_id):
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    reason = payload.get("reason", "Manual adjudication")
    recruiter_id = payload.get("recruiterId") or payload.get("recruiter_id")
    return jsonify(posting_service.override_verdict(
        get_db(), posting_id, status=status, reason=reason, recruiter_id=recruiter_id
    ))


@bp.get("/postings/<int:posting_id>/history")
def posting_history(posting_id):
    items = posting_service.get_history(get_db(), posting_id)
    return jsonify(items=items)


@bp.delete("/postings/<int:posting_id>")
def remove_posting(posting_id):
    posting_service.remove_posting(get_db(), posting_id)
    return "", 204


# ---- T2.3 indicator getters -------------------------------------------
@bp.get("/postings/<int:posting_id>/salary")
def get_salary(posting_id):
    return jsonify(indicator_service.get_salary(get_db(), posting_id))


@bp.get("/postings/<int:posting_id>/fee")
def get_fee(posting_id):
    return jsonify(indicator_service.get_fee(get_db(), posting_id))


@bp.get("/postings/<int:posting_id>/content")
def get_content(posting_id):
    return jsonify(indicator_service.get_content(get_db(), posting_id))
