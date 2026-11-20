from flask import Blueprint, current_app, jsonify, request, url_for

from ..db import get_db
from ..engine.repository import JsonRuleRepository
from ..services import candidate_service, posting_service, report_service

bp = Blueprint("reports", __name__)


def _to_camel_dict(d):
    if not isinstance(d, dict):
        return d
    res = {}
    for k, v in d.items():
        parts = k.split("_")
        camel_k = parts[0] + "".join(p.capitalize() for p in parts[1:])
        res[camel_k] = v
        res[k] = v
    res["id"] = d.get("report_id")
    return res


@bp.post("/reports")
def create_report():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request", message="body must be a JSON object"), 400

    posting_id = payload.get("postingId") or payload.get("posting_id")
    candidate_id = payload.get("candidateId") or payload.get("candidate_id")
    reason = payload.get("reason")

    if not posting_id or not candidate_id or not reason:
        return jsonify(error="validation_failed", message="postingId, candidateId, and reason are required"), 422

    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()
    result = candidate_service.report_posting(get_db(), int(posting_id), {
        "candidate_id": int(candidate_id),
        "reason": int(reason),
    }, rules)
    resp = jsonify(result)
    resp.status_code = 201
    return resp


@bp.get("/reports")
def list_all_reports():
    conn = get_db()
    posting_id = request.args.get("postingId") or request.args.get("posting_id")
    if posting_id:
        reports = report_service.list_reports(conn, int(posting_id))
    else:
        rows = conn.fetch_all("SELECT * FROM report ORDER BY report_date DESC, report_id DESC")
        reports = [report_service._report_dict(r) for r in rows]
    camel_reports = [_to_camel_dict(r) for r in reports]
    return jsonify(items=camel_reports, reports=camel_reports, count=len(reports))


@bp.post("/postings/<int:posting_id>/reports")
def report_posting(posting_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="bad_request",
                       message="body must be a JSON object (Content-Type: application/json)"), 400
    if "candidateId" in payload and "candidate_id" not in payload:
        payload["candidate_id"] = payload["candidateId"]
    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()
    result = candidate_service.report_posting(get_db(), posting_id, payload, rules)
    resp = jsonify(result)
    resp.status_code = 201
    resp.headers["Location"] = url_for("reports.list_reports", posting_id=posting_id)
    return resp


@bp.get("/postings/<int:posting_id>/reports")
def list_reports(posting_id):
    conn = get_db()
    posting_service.get_posting(conn, posting_id)
    reports = report_service.list_reports(conn, posting_id)
    camel_reports = [_to_camel_dict(r) for r in reports]
    return jsonify(posting_id=posting_id, report_count=len(reports), reports=camel_reports, items=camel_reports)


@bp.get("/candidates/<int:candidate_id>")
def display_candidate(candidate_id):
    c = _to_camel_dict(candidate_service.get_candidate(get_db(), candidate_id))
    return jsonify(candidate=c, **c)
