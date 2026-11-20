from flask import Blueprint, jsonify, request

from ..db import get_db
from ..services import escalation_service

bp = Blueprint("escalations", __name__)


@bp.get("/escalations")
def escalation_queue():
    """Recruiter queue. ?include=resolved also lists closed entries (after the open ones)."""
    include = request.args.get("include", "")
    if include not in ("", "resolved"):
        return jsonify(error="bad_request", message="include must be 'resolved' or omitted"), 400
    items = escalation_service.list_queue(get_db(), include_resolved=(include == "resolved"))
    return jsonify(count=len(items), escalations=items)


@bp.get("/escalations/<int:escalation_id>")
def display_escalation(escalation_id):
    return jsonify(escalation_service.get_escalation(get_db(), escalation_id))
