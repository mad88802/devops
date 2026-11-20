"""T10.1 - Statistics API Service for US10 Recruiter Dashboard."""
from datetime import date, datetime, timedelta


def _iso_day(d):
    if isinstance(d, (date, datetime)):
        return d.strftime("%Y-%m-%d")
    return str(d)[:10] if d else ""


def _week_start(d):
    dt = date.fromisoformat(_iso_day(d))
    return dt - timedelta(days=dt.weekday())


def _filter_postings(conn, weeks=None, company_id=None):
    where = []
    params = []
    if company_id:
        where.append("p.company_id = %s")
        params.append(company_id)
    if weeks:
        start_day = (date.today() - timedelta(weeks=weeks)).isoformat()
        where.append("p.posted_date >= %s")
        params.append(start_day)

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""
    return conn.fetch_all(f"""
        SELECT p.*, c.name as company_name, c.country as company_country, c.blacklisted
        FROM job_posting p
        JOIN company c ON p.company_id = c.company_id
        {where_sql}
        ORDER BY p.posted_date DESC
    """, params)


def stats_summary(conn, weeks=None, company_id=None):
    postings = _filter_postings(conn, weeks=weeks, company_id=company_id)
    posting_ids = [p["posting_id"] for p in postings]
    total = len(postings)

    by_status = {"P": 0, "L": 0, "S": 0, "F": 0}
    total_risk = 0
    for p in postings:
        st = p.get("status", "P")
        by_status[st] = by_status.get(st, 0) + 1
        total_risk += p.get("risk_score", 0)

    # 7-day reports
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    if posting_ids:
        placeholders = ", ".join(["%s"] * len(posting_ids))
        rep_row = conn.fetch_one(f"""
            SELECT COUNT(*) as n FROM report
            WHERE posting_id IN ({placeholders}) AND report_date >= %s
        """, posting_ids + [week_ago])
        reports_7d = rep_row["n"] if rep_row else 0
    else:
        reports_7d = 0

    all_companies = conn.fetch_all("SELECT * FROM company")
    comp_count = len(set(p["company_id"] for p in postings)) if (weeks or company_id) else len(all_companies)
    blacklisted_count = len([c for c in all_companies if c["blacklisted"] == 1 and (not company_id or c["company_id"] == company_id)])

    checked_total = conn.fetch_one("SELECT COUNT(*) as n FROM classification_result")["n"]

    return {
        "total": total,
        "byStatus": by_status,
        "fakeShare": round((by_status["F"] / total) * 100, 1) if total else 0,
        "suspiciousShare": round((by_status["S"] / total) * 100, 1) if total else 0,
        "pending": by_status["P"],
        "reports7d": reports_7d,
        "companies": comp_count,
        "blacklisted": blacklisted_count,
        "avgRisk": round(total_risk / total) if total else 0,
        "checkedTotal": checked_total,
    }


def stats_weekly(conn, weeks=9, company_id=None):
    count = min(104, max(1, int(weeks or 9)))
    postings = _filter_postings(conn, weeks=None, company_id=company_id)

    curr_monday = _week_start(date.today())
    buckets = []
    for i in range(count - 1, -1, -1):
        start_date = curr_monday - timedelta(weeks=i)
        end_date = start_date + timedelta(days=7)
        start_str = start_date.isoformat()
        end_str = end_date.isoformat()

        matched = [p for p in postings if start_str <= _iso_day(p["posted_date"]) < end_str]
        by_status = {"P": 0, "L": 0, "S": 0, "F": 0}
        for p in matched:
            st = p.get("status", "P")
            by_status[st] = by_status.get(st, 0) + 1

        tot = len(matched)
        buckets.append({
            "weekStart": start_str,
            "total": tot,
            "byStatus": by_status,
            "fake": by_status["F"],
            "fakeShare": round((by_status["F"] / tot) * 100) if tot else 0,
        })
    return buckets


def stats_by_company(conn, limit=8, weeks=None, company_id=None):
    all_companies = conn.fetch_all("SELECT * FROM company ORDER BY company_id")
    if company_id:
        all_companies = [c for c in all_companies if c["company_id"] == company_id]

    postings = _filter_postings(conn, weeks=weeks, company_id=company_id)

    res = []
    for comp in all_companies:
        cid = comp["company_id"]
        owned = [p for p in postings if p["company_id"] == cid]
        fake = len([p for p in owned if p["status"] == "F"])
        susp = len([p for p in owned if p["status"] == "S"])
        legit = len([p for p in owned if p["status"] == "L"])
        tot = len(owned)
        if tot > 0 or company_id:
            res.append({
                "companyId": cid,
                "name": comp["name"],
                "country": comp["country"],
                "total": tot,
                "fake": fake,
                "suspicious": susp,
                "legit": legit,
                "fakeShare": round((fake / tot) * 100) if tot else 0,
                "blacklisted": comp["blacklisted"],
            })

    res.sort(key=lambda x: (x["fake"], x["fakeShare"]), reverse=True)
    return res[:limit]


def stats_by_rule(conn, weeks=None, company_id=None):
    postings = _filter_postings(conn, weeks=weeks, company_id=company_id)
    if not postings:
        return []
    pids = [p["posting_id"] for p in postings]
    placeholders = ", ".join(["%s"] * len(pids))
    rows = conn.fetch_all(f"""
        SELECT rule_id as ruleId, COUNT(*) as count
        FROM classification_result
        WHERE posting_id IN ({placeholders}) AND rule_id IS NOT NULL
        GROUP BY rule_id
        ORDER BY count DESC
    """, pids)
    return rows


def recent_activity(conn, limit=8, weeks=None, company_id=None):
    postings = _filter_postings(conn, weeks=weeks, company_id=company_id)
    if not postings:
        return []
    pids = [p["posting_id"] for p in postings]
    placeholders = ", ".join(["%s"] * len(pids))
    rows = conn.fetch_all(f"""
        SELECT cr.*, p.title as posting_title, c.name as company_name
        FROM classification_result cr
        JOIN job_posting p ON cr.posting_id = p.posting_id
        JOIN company c ON p.company_id = c.company_id
        WHERE cr.posting_id IN ({placeholders})
        ORDER BY cr.decision_date DESC, cr.result_id DESC
        LIMIT %s
    """, pids + [int(limit)])

    out = []
    for r in rows:
        out.append({
            "id": r["result_id"],
            "postingId": r["posting_id"],
            "title": r["posting_title"],
            "company": r["company_name"],
            "label": r["label"],
            "score": r["score"],
            "ruleId": r["rule_id"],
            "mode": "auto" if r["rule_id"] != "MANUAL" else "manual",
            "at": str(r["decision_date"]),
        })
    return out
