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
    email = (payload.get("email") or "").strip().lower()
    role = payload.get("role")
    user_id = payload.get("userId")
    conn = get_db()

    # 1. Search by email if provided
    if email:
        rec = conn.fetch_one("SELECT * FROM recruiter WHERE LOWER(email) = %s", (email,))
        if rec:
            return jsonify(user={
                "id": rec["recruiter_id"],
                "kind": "recruiter",
                "name": rec["name"],
                "surname": rec["surname"],
                "fullName": f"{rec['name']} {rec['surname']}",
                "email": rec["email"],
                "role": rec["role"],
            })
        cand = conn.fetch_one("SELECT * FROM candidate WHERE LOWER(email) = %s", (email,))
        if cand:
            return jsonify(user={
                "id": cand["candidate_id"],
                "kind": "candidate",
                "name": cand["name"],
                "surname": cand["surname"],
                "fullName": f"{cand['name']} {cand['surname']}",
                "email": cand["email"],
                "role": None,
            })
        adm = conn.fetch_one("SELECT * FROM it_admin WHERE LOWER(email) = %s", (email,))
        if adm:
            name_parts = adm["name"].split(" ")
            return jsonify(user={
                "id": adm["admin_id"],
                "kind": "admin",
                "name": name_parts[0],
                "surname": " ".join(name_parts[1:]) if len(name_parts) > 1 else "",
                "fullName": adm["name"],
                "email": adm["email"],
                "role": None,
            })
        return jsonify(error={"message": "error.credentials", "fields": {"auth.email": "error.credentials"}}), 401

    # 2. Fall back to role/userId selector
    role = role or "recruiter"
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


@bp.post("/auth/register")
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    name = (payload.get("name") or "").strip()
    surname = (payload.get("surname") or "").strip()
    kind = payload.get("kind", "recruiter")
    conn = get_db()

    if not email:
        return jsonify(error={"message": "error.required", "fields": {"auth.email": "error.required"}}), 422
    if not name:
        return jsonify(error={"message": "error.required", "fields": {"auth.name": "error.required"}}), 422

    exists = (
        conn.fetch_one("SELECT 1 FROM recruiter WHERE LOWER(email) = %s", (email,)) or
        conn.fetch_one("SELECT 1 FROM candidate WHERE LOWER(email) = %s", (email,)) or
        conn.fetch_one("SELECT 1 FROM it_admin WHERE LOWER(email) = %s", (email,))
    )
    if exists:
        return jsonify(error={"message": "error.emailTaken", "fields": {"auth.email": "error.emailTaken"}}), 409

    if kind == "candidate":
        cand_id = conn.insert(
            "INSERT INTO candidate (name, surname, email) VALUES (%s, %s, %s)",
            (name, surname or name, email),
        )
        conn.commit()
        return jsonify(user={
            "id": cand_id,
            "kind": "candidate",
            "name": name,
            "surname": surname,
            "fullName": f"{name} {surname}".strip(),
            "email": email,
            "role": None,
        }), 201

    elif kind == "admin":
        full_name = f"{name} {surname}".strip()
        adm_id = conn.insert(
            "INSERT INTO it_admin (name, email) VALUES (%s, %s)",
            (full_name, email),
        )
        conn.commit()
        return jsonify(user={
            "id": adm_id,
            "kind": "admin",
            "name": name,
            "surname": surname,
            "fullName": full_name,
            "email": email,
            "role": None,
        }), 201

    else:
        role_code = "S" if payload.get("role") in ["Senior", "S"] else "R"
        rec_id = conn.insert(
            "INSERT INTO recruiter (name, surname, email, role) VALUES (%s, %s, %s, %s)",
            (name, surname or name, email, role_code),
        )
        conn.commit()
        return jsonify(user={
            "id": rec_id,
            "kind": "recruiter",
            "name": name,
            "surname": surname,
            "fullName": f"{name} {surname}".strip(),
            "email": email,
            "role": role_code,
        }), 201


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
