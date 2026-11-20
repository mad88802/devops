from flask import Blueprint, jsonify, request, url_for

from ..db import get_db
from ..services import recruiter_service

bp = Blueprint("admin_recruiters", __name__)


def _to_camel_dict(d):
    if not isinstance(d, dict):
        return d
    res = {}
    for k, v in d.items():
        parts = k.split("_")
        camel_k = parts[0] + "".join(p.capitalize() for p in parts[1:])
        res[camel_k] = v
        res[k] = v
    res["id"] = d.get("recruiter_id") or d.get("candidate_id")
    return res


def _object_body():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else None


_BAD_BODY = ({"error": "bad_request",
              "message": "body must be a JSON object (Content-Type: application/json)"}, 400)


@bp.post("/admin/recruiters")
@bp.post("/recruiters")
def create_recruiter():
    payload = _object_body()
    if payload is None:
        return jsonify(_BAD_BODY[0]), 400
    recruiter = recruiter_service.create_recruiter(get_db(), payload)
    c = _to_camel_dict(recruiter)
    resp = jsonify(recruiter=c, **c)
    resp.status_code = 201
    resp.headers["Location"] = url_for("admin_recruiters.display_recruiter",
                                       recruiter_id=recruiter["recruiter_id"])
    return resp


@bp.get("/admin/recruiters")
@bp.get("/recruiters")
def list_recruiters():
    role = request.args.get("role")
    if role not in (None, "") + recruiter_service.ROLES:
        return jsonify(error="bad_request", message="role must be R or S"), 400
    items = recruiter_service.list_recruiters(get_db(), role=role if role else None)
    camel_items = [_to_camel_dict(r) for r in items]
    return jsonify(items=camel_items, count=len(items), recruiters=camel_items)


@bp.get("/admin/recruiters/<int:recruiter_id>")
@bp.get("/recruiters/<int:recruiter_id>")
def display_recruiter(recruiter_id):
    c = _to_camel_dict(recruiter_service.get_recruiter(get_db(), recruiter_id))
    return jsonify(recruiter=c, **c)


@bp.route("/admin/recruiters/<int:recruiter_id>", methods=["PATCH", "PUT"])
@bp.route("/recruiters/<int:recruiter_id>", methods=["PATCH", "PUT"])
def update_recruiter(recruiter_id):
    """Partial update: only the fields sent are changed (PUT behaves like PATCH)."""
    payload = _object_body()
    if payload is None:
        return jsonify(_BAD_BODY[0]), 400
    c = _to_camel_dict(recruiter_service.update_recruiter(get_db(), recruiter_id, payload))
    return jsonify(recruiter=c, **c)


@bp.delete("/admin/recruiters/<int:recruiter_id>")
@bp.delete("/recruiters/<int:recruiter_id>")
def delete_recruiter(recruiter_id):
    recruiter_service.delete_recruiter(get_db(), recruiter_id)
    return jsonify(ok=True)


@bp.get("/candidates")
def list_candidates():
    conn = get_db()
    rows = conn.fetch_all("SELECT * FROM candidate ORDER BY candidate_id")
    camel_rows = [_to_camel_dict(r) for r in rows]
    return jsonify(items=camel_rows, candidates=camel_rows, count=len(rows))
