from flask import Blueprint, jsonify, request

from ..db import get_db

bp = Blueprint("auth", __name__)


def _to_camel_dict(d):
    if not isinstance(d, dict):
        return d
    res = {}
    for k, v in d.items():
        parts = k.split("_")
        camel_k = parts[0] + "".join(p.capitalize() for p in parts[1:])
        res[camel_k] = v
        res[k] = v
    return res


@bp.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    role = payload.get("role", "recruiter")
    user_id = payload.get("userId")
    conn = get_db()

    if role == "recruiter":
        if user_id:
            row = conn.fetch_one("SELECT * FROM recruiter WHERE recruiter_id = %s", (user_id,))
        else:
            row = conn.fetch_one("SELECT * FROM recruiter ORDER BY recruiter_id ASC LIMIT 1")
        if not row:
            return jsonify(error="not_found", message="Recruiter not found"), 404
        return jsonify(user={
            "id": row["recruiter_id"],
            "kind": "recruiter",
            "name": row["name"],
            "surname": row["surname"],
            "fullName": f"{row['name']} {row['surname']}",
            "email": row["email"],
            "role": row["role"],
        })

    elif role == "candidate":
        if user_id:
            row = conn.fetch_one("SELECT * FROM candidate WHERE candidate_id = %s", (user_id,))
        else:
            row = conn.fetch_one("SELECT * FROM candidate ORDER BY candidate_id ASC LIMIT 1")
        if not row:
            return jsonify(error="not_found", message="Candidate not found"), 404
        return jsonify(user={
            "id": row["candidate_id"],
            "kind": "candidate",
            "name": row["name"],
            "surname": row["surname"],
            "fullName": f"{row['name']} {row['surname']}",
            "email": row["email"],
            "role": None,
        })

    elif role == "admin":
        if user_id:
            row = conn.fetch_one("SELECT * FROM it_admin WHERE admin_id = %s", (user_id,))
        else:
            row = conn.fetch_one("SELECT * FROM it_admin ORDER BY admin_id ASC LIMIT 1")
        if not row:
            return jsonify(error="not_found", message="Admin not found"), 404
        name_parts = row["name"].split(" ")
        return jsonify(user={
            "id": row["admin_id"],
            "kind": "admin",
            "name": name_parts[0],
            "surname": " ".join(name_parts[1:]) if len(name_parts) > 1 else "",
            "fullName": row["name"],
            "email": row["email"],
            "role": None,
        })

    return jsonify(error="bad_request", message=f"Unknown role: {role}"), 400


@bp.get("/auth/accounts")
def accounts():
    conn = get_db()
    recs = conn.fetch_all("SELECT * FROM recruiter ORDER BY recruiter_id")
    cands = conn.fetch_all("SELECT * FROM candidate ORDER BY candidate_id")
    admins = conn.fetch_all("SELECT * FROM it_admin ORDER BY admin_id")

    def _rec(r):
        return {
            "id": r["recruiter_id"],
            "name": r["name"],
            "surname": r["surname"],
            "fullName": f"{r['name']} {r['surname']}",
            "email": r["email"],
            "role": r["role"],
        }

    def _cand(c):
        return {
            "id": c["candidate_id"],
            "name": c["name"],
            "surname": c["surname"],
            "fullName": f"{c['name']} {c['surname']}",
            "email": c["email"],
        }

    def _adm(a):
        return {
            "id": a["admin_id"],
            "name": a["name"],
            "email": a["email"],
        }

    return jsonify(
        recruiters=[_rec(r) for r in recs],
        candidates=[_cand(c) for c in cands],
        admins=[_adm(a) for a in admins],
    )
