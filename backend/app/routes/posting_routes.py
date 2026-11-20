from flask import Blueprint, current_app, jsonify, request, url_for

from ..db import get_db
from ..engine.repository import JsonRuleRepository
from ..services import indicator_service, posting_service

bp = Blueprint("postings", __name__)


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
    resp.headers["Location"] = url_for("postings.display_posting",
                                       posting_id=posting["posting_id"])
    return resp


@bp.get("/postings/<int:posting_id>")
def display_posting(posting_id):
    return jsonify(posting_service.display_posting(get_db(), posting_id))


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
