"""T2.1 - Posting service (Posting_Intf): Insert_Posting, Display_Posting, Remove_Posting, List_Postings."""
from datetime import date
import math

from ..errors import NotFoundError, ValidationError
from ..validation import STATUSES, validate_posting
from . import admin_company_service, company_service, escalation_service, indicator_service, report_service
from ._util import clean_row, to_iso

_POSTING_COLS = ("company_id", "title", "description", "location",
                 "employment_type", "posted_date")
_INDICATOR_TABLES = ("salary_indicators", "fee_indicators", "content_indicators")


def _age_days(posted_date):
    if not posted_date:
        return 0
    d = date.fromisoformat(to_iso(posted_date))
    return max(0, (date.today() - d).days)


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


def _normalize_payload(payload, conn):
    """Normalize frontend nested payload into backend flat structure if needed."""
    if not isinstance(payload, dict):
        return payload
    
    # Check if payload is from the React form: { posting: {...}, company: {...}, salary: {...}, fee: {...}, content: {...} }
    if "posting" in payload or "salary" in payload or "fee" in payload or "content" in payload:
        p_block = payload.get("posting", {})
        c_block = payload.get("company", {})
        s_block = payload.get("salary", {})
        f_block = payload.get("fee", {})
        k_block = payload.get("content", {})
        
        # Resolve company_id
        company_id = c_block.get("companyId") or c_block.get("company_id") or payload.get("company_id")
        if not company_id and c_block.get("name"):
            # Company created on the fly in the form
            new_comp = admin_company_service.create_company(conn, {
                "name": c_block.get("name"),
                "country": c_block.get("country"),
                "industry": c_block.get("industry"),
                "age_years": int(c_block.get("ageYears", c_block.get("age_years", 0)) or 0),
                "has_profile": int(c_block.get("hasProfile", c_block.get("has_profile", 0)) or 0),
                "website_verified": int(c_block.get("websiteVerified", c_block.get("website_verified", 0)) or 0),
                "postings_last_24h": int(c_block.get("postingsLast24h", c_block.get("postings_last_24h", 0)) or 0),
            })
            company_id = new_comp["company_id"]
            
        flat = {
            "company_id": int(company_id) if company_id else None,
            "title": p_block.get("title", payload.get("title")),
            "description": p_block.get("description", payload.get("description")),
            "location": p_block.get("location", payload.get("location")),
            "employment_type": int(p_block.get("employmentType", p_block.get("employment_type", payload.get("employment_type", 0))) or 0),
            "posted_date": p_block.get("postedDate", p_block.get("posted_date", payload.get("posted_date"))),
        }

        # Salary block
        if s_block:
            flat["salary_indicators"] = {
                "salary_level": int(s_block.get("salaryLevel", s_block.get("salary_level", 0)) or 0),
                "salary_hidden": int(s_block.get("salaryHidden", s_block.get("salary_hidden", 0)) or 0),
                "salary_min": s_block.get("salaryMin", s_block.get("salary_min")),
                "salary_max": s_block.get("salaryMax", s_block.get("salary_max")),
                "currency": s_block.get("currency"),
            }
            if flat["salary_indicators"]["salary_min"] is not None:
                flat["salary_indicators"]["salary_min"] = int(flat["salary_indicators"]["salary_min"])
            if flat["salary_indicators"]["salary_max"] is not None:
                flat["salary_indicators"]["salary_max"] = int(flat["salary_indicators"]["salary_max"])

        # Fee block
        if f_block:
            fee_req = int(f_block.get("feeRequested", f_block.get("fee_requested", 0)) or 0)
            fee_type = int(f_block.get("feeType", f_block.get("fee_type", 0)) or 0)
            pay_bef = int(f_block.get("paymentBeforeInterview", f_block.get("payment_before_interview", 0)) or 0)
            if fee_req == 0:
                fee_type = 0
                pay_bef = 0
            flat["fee_indicators"] = {
                "fee_requested": fee_req,
                "fee_type": fee_type,
                "payment_before_interview": pay_bef,
            }

        # Content block
        if k_block:
            flat["content_indicators"] = {
                "personal_info_requested": int(k_block.get("personalInfoRequested", k_block.get("personal_info_requested", 0)) or 0),
                "urgency_language": int(k_block.get("urgencyLanguage", k_block.get("urgency_language", 0)) or 0),
                "description_quality": int(k_block.get("descriptionQuality", k_block.get("description_quality", 1)) or 0),
                "contact_channel": int(k_block.get("contactChannel", k_block.get("contact_channel", 0)) or 0),
            }

        return flat

    return payload


def _posting_dict(row):
    out = clean_row(row, ("posted_date",))
    out["age_days"] = _age_days(out["posted_date"])      # JobPosting.Age_Days()
    out["id"] = out["posting_id"]
    out["postedDate"] = out["posted_date"]
    out["employmentType"] = out["employment_type"]
    out["riskScore"] = out["risk_score"]
    return out


def insert_posting(conn, payload, rules=None):
    """Validate, then store the posting and its indicator rows in ONE transaction."""
    norm = _normalize_payload(payload, conn)
    data = validate_posting(norm)
    if not company_service.company_exists(conn, data["company_id"]):
        raise ValidationError([{"field": "company_id", "message": "company does not exist"}])
    try:
        cols = ", ".join(_POSTING_COLS)
        marks = ", ".join(["%s"] * len(_POSTING_COLS))
        posting_id = conn.insert(
            f"INSERT INTO job_posting ({cols}) VALUES ({marks})",
            [data[c] for c in _POSTING_COLS])
        for table in _INDICATOR_TABLES:
            block = data[table]
            if block is None:
                continue
            names = ["posting_id"] + list(block)
            conn.insert(
                f"INSERT INTO {table} ({', '.join(names)}) "
                f"VALUES ({', '.join(['%s'] * len(names))})",
                [posting_id] + list(block.values()))
        if rules is not None:
            from ..engine import admin_rules
            admin_rules.apply_insert_rules(conn, rules, posting_id, data["company_id"])
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return display_posting(conn, posting_id)


def update_posting(conn, posting_id, payload):
    """Update posting metadata and/or indicators."""
    get_posting(conn, posting_id)
    norm = _normalize_payload(payload, conn)
    try:
        updates = []
        params = []
        for c in ("title", "description", "location", "employment_type"):
            if c in norm and norm[c] is not None:
                updates.append(f"{c} = %s")
                params.append(norm[c])
        if updates:
            params.append(posting_id)
            conn.update(f"UPDATE job_posting SET {', '.join(updates)} WHERE posting_id = %s", params)

        if "salary_indicators" in norm and norm["salary_indicators"]:
            s = norm["salary_indicators"]
            conn.update("UPDATE salary_indicators SET salary_level=%s, salary_hidden=%s, salary_min=%s, salary_max=%s, currency=%s WHERE posting_id=%s",
                        (s.get("salary_level", 0), s.get("salary_hidden", 0), s.get("salary_min"), s.get("salary_max"), s.get("currency"), posting_id))
        if "fee_indicators" in norm and norm["fee_indicators"]:
            f = norm["fee_indicators"]
            conn.update("UPDATE fee_indicators SET fee_requested=%s, fee_type=%s, payment_before_interview=%s WHERE posting_id=%s",
                        (f.get("fee_requested", 0), f.get("fee_type", 0), f.get("payment_before_interview", 0), posting_id))
        if "content_indicators" in norm and norm["content_indicators"]:
            k = norm["content_indicators"]
            conn.update("UPDATE content_indicators SET personal_info_requested=%s, urgency_language=%s, description_quality=%s, contact_channel=%s WHERE posting_id=%s",
                        (k.get("personal_info_requested", 0), k.get("urgency_language", 0), k.get("description_quality", 1), k.get("contact_channel", 0), posting_id))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return display_posting(conn, posting_id)


def get_posting(conn, posting_id):
    """The bare job_posting row (no company, no indicators)."""
    row = conn.fetch_one("SELECT * FROM job_posting WHERE posting_id = %s", (posting_id,))
    if row is None:
        raise NotFoundError(f"posting {posting_id} not found")
    return row


def get_history(conn, posting_id):
    """Classification history for a posting."""
    rows = conn.fetch_all("""
        SELECT cr.*, r.name as recruiter_name, r.surname as recruiter_surname
        FROM classification_result cr
        LEFT JOIN recruiter r ON cr.recruiter_id = r.recruiter_id
        WHERE cr.posting_id = %s
        ORDER BY cr.decision_date DESC, cr.result_id DESC
    """, (posting_id,))
    out = []
    for r in rows:
        d = dict(r)
        d["id"] = d.get("result_id")
        d["postingId"] = d.get("posting_id")
        d["recruiterId"] = d.get("recruiter_id")
        d["decisionDate"] = str(d.get("decision_date"))
        d["ruleId"] = d.get("rule_id")
        if d.get("recruiter_name"):
            d["recruiterName"] = f"{d.get('recruiter_name')} {d.get('recruiter_surname')}"
        else:
            d["recruiterName"] = "System"
        out.append(d)
    return out


def display_posting(conn, posting_id):
    out = _posting_dict(get_posting(conn, posting_id))
    raw_comp = company_service.get_company(conn, out["company_id"])
    comp = _to_camel_dict(raw_comp)
    comp["id"] = comp["company_id"]
    out["company"] = comp

    inds = indicator_service.find_indicators(conn, posting_id)
    out.update(inds)

    salary_dict = _to_camel_dict(inds.get("salary_indicators"))
    fee_dict = _to_camel_dict(inds.get("fee_indicators"))
    content_dict = _to_camel_dict(inds.get("content_indicators"))

    out["salary"] = salary_dict
    out["fee"] = fee_dict
    out["content"] = content_dict

    reports = report_service.list_reports(conn, posting_id)
    out["reportCount"] = len(reports)
    out["reports"] = reports
    out["lastReportedAt"] = reports[-1]["report_date"] if reports else None

    history = get_history(conn, posting_id)
    out["history"] = history
    latest = history[0] if history else None
    out["firedRule"] = latest.get("ruleId") if latest else None
    out["checkedAt"] = latest.get("decisionDate") if latest else None
    out["checkedBy"] = latest.get("recruiterId") if latest else None

    # Facts structure for client-side live trace
    facts = {
        "company": {
            "hasProfile": comp.get("has_profile", 0),
            "websiteVerified": comp.get("website_verified", 0),
            "blacklisted": comp.get("blacklisted", 0),
            "ageYears": comp.get("age_years", 0),
            "postingsLast24h": comp.get("postings_last_24h", 0),
            "fakePostingsCount": comp.get("fake_postings_count", 0),
        },
        "salary": {
            "salaryLevel": salary_dict.get("salary_level", 0) if salary_dict else 0,
            "salaryHidden": salary_dict.get("salary_hidden", 0) if salary_dict else 0,
        },
        "fee": {
            "feeRequested": fee_dict.get("fee_requested", 0) if fee_dict else 0,
            "feeType": fee_dict.get("fee_type", 0) if fee_dict else 0,
            "paymentBeforeInterview": fee_dict.get("payment_before_interview", 0) if fee_dict else 0,
        },
        "content": {
            "personalInfoRequested": content_dict.get("personal_info_requested", 0) if content_dict else 0,
            "urgencyLanguage": content_dict.get("urgency_language", 0) if content_dict else 0,
            "descriptionQuality": content_dict.get("description_quality", 1) if content_dict else 1,
            "contactChannel": content_dict.get("contact_channel", 0) if content_dict else 0,
        },
        "posting": {"status": out["status"], "riskScore": out["risk_score"]},
        "reports": {"count": len(reports)},
    }

    result = dict(out)
    result["posting"] = out
    result["facts"] = facts
    return result


def list_postings(conn, q=None, status=None, company_id=None, min_risk=None,
                  sort="recent", page=1, limit=10, pending_only=False):
    """T7.1 & T7.2: List, filter, search, and paginate postings."""
    where = []
    params = []

    if pending_only:
        where.append("p.status = 'P'")
    elif status:
        statuses = [s.strip() for s in status.split(",") if s.strip()]
        if statuses:
            placeholders = ", ".join(["%s"] * len(statuses))
            where.append(f"p.status IN ({placeholders})")
            params.extend(statuses)

    if company_id is not None:
        where.append("p.company_id = %s")
        params.append(company_id)

    if min_risk is not None:
        where.append("p.risk_score >= %s")
        params.append(min_risk)

    if q:
        kw = f"%{q.strip().lower()}%"
        where.append("(LOWER(p.title) LIKE %s OR LOWER(p.location) LIKE %s OR LOWER(c.name) LIKE %s)")
        params.extend([kw, kw, kw])

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""

    # Count total
    count_sql = f"""
        SELECT COUNT(*) as total
        FROM job_posting p
        JOIN company c ON p.company_id = c.company_id
        {where_sql}
    """
    total = conn.fetch_one(count_sql, params)["total"]

    # Sorting
    sort_orders = {
        "recent": "p.posted_date DESC, p.posting_id DESC",
        "oldest": "p.posted_date ASC, p.posting_id ASC",
        "risk_desc": "p.risk_score DESC",
        "risk_asc": "p.risk_score ASC",
    }
    order_clause = sort_orders.get(sort, sort_orders["recent"])

    page = max(1, int(page or 1))
    limit = max(1, min(100, int(limit or 10)))
    offset = (page - 1) * limit

    select_sql = f"""
        SELECT p.posting_id
        FROM job_posting p
        JOIN company c ON p.company_id = c.company_id
        {where_sql}
        ORDER BY {order_clause}
        LIMIT {limit} OFFSET {offset}
    """
    rows = conn.fetch_all(select_sql, params)
    items = [display_posting(conn, r["posting_id"])["posting"] for r in rows]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit)),
    }


def override_verdict(conn, posting_id, status, reason, recruiter_id=None):
    """Human override of a machine verdict."""
    posting = get_posting(conn, posting_id)
    if status not in STATUSES:
        raise ValidationError([{"field": "status", "message": "invalid status"}])
    try:
        set_status(conn, posting_id, status, posting["risk_score"])
        conn.insert(
            "INSERT INTO classification_result (posting_id, recruiter_id, label, score, rule_id) "
            "VALUES (%s, %s, %s, %s, %s)",
            (posting_id, recruiter_id, status, posting["risk_score"], "MANUAL")
        )
        escalation_service.resolve_for_posting(conn, posting_id, recruiter_id)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return display_posting(conn, posting_id)


def remove_posting(conn, posting_id):
    """Delete a posting. Indicators, reports and classification history go with it."""
    try:
        n = conn.delete("DELETE FROM job_posting WHERE posting_id = %s", (posting_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    if n == 0:
        raise NotFoundError(f"posting {posting_id} not found")


def set_status(conn, posting_id, status, risk_score):
    """JobPosting.Set_Status: update status and risk score."""
    problems = []
    if status not in STATUSES:
        problems.append({"field": "status", "message": "must be one of " + ", ".join(STATUSES)})
    if not isinstance(risk_score, int) or isinstance(risk_score, bool) or not 0 <= risk_score <= 100:
        problems.append({"field": "risk_score", "message": "must be an integer from 0 to 100"})
    if problems:
        raise ValidationError(problems)
    conn.update("UPDATE job_posting SET status = %s, risk_score = %s WHERE posting_id = %s",
                (status, risk_score, posting_id))
