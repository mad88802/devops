from flask import Blueprint, current_app, jsonify, request, url_for

from ..db import get_db
from ..engine.repository import JsonRuleRepository
from ..services import candidate_service, posting_service, report_service

bp = Blueprint("reports", __name__)


@bp.post("/postings/<int:posting_id>/reports")
def report_posting(posting_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request",
                       message="body must be a JSON object (Content-Type: application/json)"), 400
    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()     # reloaded per report
    result = candidate_service.report_posting(get_db(), posting_id, payload, rules)
    resp = jsonify(result)
    resp.status_code = 201
    resp.headers["Location"] = url_for("reports.list_reports", posting_id=posting_id)
    return resp


@bp.get("/postings/<int:posting_id>/reports")
def list_reports(posting_id):
    conn = get_db()
    posting_service.get_posting(conn, posting_id)                           # 404 if missing
    reports = report_service.list_reports(conn, posting_id)
    return jsonify(posting_id=posting_id, report_count=len(reports), reports=reports)


@bp.get("/candidates/<int:candidate_id>")
def display_candidate(candidate_id):
    return jsonify(candidate_service.get_candidate(get_db(), candidate_id))
