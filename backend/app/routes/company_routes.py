from flask import Blueprint, jsonify

from ..db import get_db
from ..services import company_service

bp = Blueprint("companies", __name__)


@bp.get("/companies/<int:company_id>")
def get_company(company_id):
    return jsonify(company_service.get_company(get_db(), company_id))
