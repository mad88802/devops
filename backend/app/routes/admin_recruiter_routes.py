from flask import Blueprint, jsonify, request, url_for

from ..db import get_db
from ..services import recruiter_service

bp = Blueprint("admin_recruiters", __name__)


def _object_body():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else None


_BAD_BODY = ({"error": "bad_request",
              "message": "body must be a JSON object (Content-Type: application/json)"}, 400)


@bp.post("/admin/recruiters")
def create_recruiter():
    payload = _object_body()
    if payload is None:
        return jsonify(_BAD_BODY[0]), 400
    recruiter = recruiter_service.create_recruiter(get_db(), payload)
    resp = jsonify(recruiter)
    resp.status_code = 201
    resp.headers["Location"] = url_for("admin_recruiters.display_recruiter",
                                       recruiter_id=recruiter["recruiter_id"])
    return resp


@bp.get("/admin/recruiters")
def list_recruiters():
    role = request.args.get("role")
    if role not in (None,) + recruiter_service.ROLES:
        return jsonify(error="bad_request", message="role must be R or S"), 400
    items = recruiter_service.list_recruiters(get_db(), role=role)
    return jsonify(count=len(items), recruiters=items)


@bp.get("/admin/recruiters/<int:recruiter_id>")
def display_recruiter(recruiter_id):
    return jsonify(recruiter_service.get_recruiter(get_db(), recruiter_id))


@bp.route("/admin/recruiters/<int:recruiter_id>", methods=["PATCH", "PUT"])
def update_recruiter(recruiter_id):
    """Partial update: only the fields sent are changed (PUT behaves like PATCH)."""
    payload = _object_body()
    if payload is None:
        return jsonify(_BAD_BODY[0]), 400
    return jsonify(recruiter_service.update_recruiter(get_db(), recruiter_id, payload))


@bp.delete("/admin/recruiters/<int:recruiter_id>")
def delete_recruiter(recruiter_id):
    recruiter_service.delete_recruiter(get_db(), recruiter_id)
    return "", 204
