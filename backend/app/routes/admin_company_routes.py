from flask import Blueprint, jsonify, request, url_for

from ..db import get_db
from ..services import admin_company_service, company_service

bp = Blueprint("admin_companies", __name__)


def _json_body():
    return request.get_json(silent=True)


@bp.post("/admin/companies")
def create_company():
    payload = _json_body()
    if not isinstance(payload, dict):
        return jsonify(error="bad_request",
                       message="body must be a JSON object (Content-Type: application/json)"), 400
    company = admin_company_service.create_company(get_db(), payload)
    resp = jsonify(company)
    resp.status_code = 201
    resp.headers["Location"] = url_for("admin_companies.display_company",
                                       company_id=company["company_id"])
    return resp


@bp.get("/admin/companies")
def list_companies():
    flag = request.args.get("blacklisted")
    if flag not in (None, "0", "1"):
        return jsonify(error="bad_request", message="blacklisted must be 0 or 1"), 400
    items = admin_company_service.list_companies(
        get_db(), blacklisted=None if flag is None else int(flag),
        search=request.args.get("q", "").strip() or None)
    return jsonify(count=len(items), companies=items)


@bp.get("/admin/companies/<int:company_id>")
def display_company(company_id):
    return jsonify(company_service.get_company(get_db(), company_id))


@bp.route("/admin/companies/<int:company_id>", methods=["PATCH", "PUT"])
def update_company(company_id):
    """Partial update: only the fields sent are changed (PUT behaves like PATCH)."""
    payload = _json_body()
    if not isinstance(payload, dict):
        return jsonify(error="bad_request",
                       message="body must be a JSON object (Content-Type: application/json)"), 400
    return jsonify(admin_company_service.update_company(get_db(), company_id, payload))


@bp.delete("/admin/companies/<int:company_id>")
def delete_company(company_id):
    admin_company_service.delete_company(get_db(), company_id)
    return "", 204
