from flask import Blueprint, current_app, jsonify, request

from ..db import get_db
from ..engine.repository import JsonRuleRepository
from ..errors import ValidationError
from ..services import tocheck_service

bp = Blueprint("check", __name__)


@bp.post("/postings/<int:posting_id>/check")
def to_check(posting_id):
    body = request.get_json(silent=True) if request.data else {}
    if not isinstance(body, dict):
        return jsonify(error="bad_request", message="body must be a JSON object or empty"), 400

    recruiter_id = body.get("recruiter_id") or body.get("recruiterId")
    unknown = [k for k in body if k not in ("recruiter_id", "recruiterId")]
    if unknown:
        raise ValidationError([{"field": k, "message": "unknown field"} for k in unknown])

    rules = JsonRuleRepository(current_app.config["RULES_PATH"]).load()   # reloaded per check
    outcome = tocheck_service.to_check(get_db(), posting_id, rules,
                                       recruiter_id=int(recruiter_id) if recruiter_id else None)
    return jsonify(outcome)
