"""T2.2 - Validation of coded values (Appendix A.4 of the brief).

The database also enforces these codes with CHECK constraints; validating here
returns a clear 422 listing *every* problem instead of a raw SQL error.
Integers must be real JSON integers: true/false and "1" are rejected.
"""
import re
from datetime import date

from .errors import ValidationError

# ---- allowed codes -------------------------------------------------------
EMPLOYMENT_TYPES = (0, 1, 2)        # our convention: 0 full-time, 1 part-time, 2 contract
STATUSES = ("P", "L", "S", "F")     # Pending, Legit, Suspicious, Fake

SALARY_CODES = {"salary_level": (0, 1, 2), "salary_hidden": (0, 1)}
FEE_CODES = {"fee_requested": (0, 1), "fee_type": (0, 1, 2, 3),
             "payment_before_interview": (0, 1)}
CONTENT_CODES = {"personal_info_requested": (0, 1, 2), "urgency_language": (0, 1, 2),
                 "description_quality": (0, 1, 2), "contact_channel": (0, 1, 2)}

POSTING_FIELDS = {"company_id", "title", "description", "location",
                  "employment_type", "posted_date",
                  "salary_indicators", "fee_indicators", "content_indicators"}
SYSTEM_FIELDS = {"posting_id", "status", "risk_score"}     # never set by the client
SALARY_FIELDS = set(SALARY_CODES) | {"salary_min", "salary_max", "currency"}

INT_MAX = 2_147_483_647
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_CURRENCY_RE = re.compile(r"^[A-Z]{3}$")


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


class _Errors:
    def __init__(self):
        self.items = []

    def add(self, field, message):
        self.items.append({"field": field, "message": message})


def _code(errors, data, key, allowed, prefix=""):
    """Required coded integer: must be present and one of `allowed`."""
    name = prefix + key
    if key not in data or data[key] is None:
        errors.add(name, "is required")
        return None
    v = data[key]
    if not _is_int(v) or v not in allowed:
        errors.add(name, "must be one of " + ", ".join(map(str, allowed)))
        return None
    return v


def _unknown(errors, data, allowed, prefix=""):
    for k in data:
        if k not in allowed:
            errors.add(prefix + k, "unknown field")


def _text(errors, data, key, max_len, required=False):
    v = data.get(key)
    if v is None:
        if required:
            errors.add(key, "is required")
        return None
    if not isinstance(v, str):
        errors.add(key, "must be a string")
        return None
    v = v.strip()
    if required and not v:
        errors.add(key, "must not be empty")
    elif len(v) > max_len:
        errors.add(key, f"must be at most {max_len} characters")
    return v or None


def _amount(errors, data, key, prefix):
    v = data.get(key)
    if v is None:
        return None
    if not _is_int(v) or v < 0 or v > INT_MAX:
        errors.add(prefix + key, "must be a non-negative integer")
        return None
    return v


# ---- indicator blocks ----------------------------------------------------
def validate_salary(data, errors, prefix="salary_indicators."):
    if not isinstance(data, dict):
        errors.add(prefix.rstrip("."), "must be an object")
        return None
    _unknown(errors, data, SALARY_FIELDS, prefix)
    out = {k: _code(errors, data, k, a, prefix) for k, a in SALARY_CODES.items()}
    lo = _amount(errors, data, "salary_min", prefix)
    hi = _amount(errors, data, "salary_max", prefix)
    cur = data.get("currency")
    if cur is not None and (not isinstance(cur, str) or not _CURRENCY_RE.match(cur)):
        errors.add(prefix + "currency", "must be a 3-letter uppercase code, e.g. DZD")
        cur = None
    if lo is not None and hi is not None and lo > hi:
        errors.add(prefix + "salary_min", "must not be greater than salary_max")
    if out["salary_hidden"] == 1 and (lo is not None or hi is not None or cur is not None):
        errors.add(prefix + "salary_hidden",
                   "salary is hidden: salary_min, salary_max and currency must be null")
    elif (lo is not None or hi is not None) and cur is None:
        errors.add(prefix + "currency", "is required when an amount is given")
    out.update(salary_min=lo, salary_max=hi, currency=cur)
    return out


def validate_fee(data, errors, prefix="fee_indicators."):
    if not isinstance(data, dict):
        errors.add(prefix.rstrip("."), "must be an object")
        return None
    _unknown(errors, data, set(FEE_CODES), prefix)
    out = {k: _code(errors, data, k, a, prefix) for k, a in FEE_CODES.items()}
    if out["fee_requested"] == 0:
        if out["fee_type"] not in (0, None):
            errors.add(prefix + "fee_type", "must be 0 when fee_requested is 0")
        if out["payment_before_interview"] not in (0, None):
            errors.add(prefix + "payment_before_interview",
                       "must be 0 when fee_requested is 0")
    elif out["fee_requested"] == 1 and out["fee_type"] == 0:
        errors.add(prefix + "fee_type", "must be 1, 2 or 3 when fee_requested is 1")
    return out


def validate_content(data, errors, prefix="content_indicators."):
    if not isinstance(data, dict):
        errors.add(prefix.rstrip("."), "must be an object")
        return None
    _unknown(errors, data, set(CONTENT_CODES), prefix)
    return {k: _code(errors, data, k, a, prefix) for k, a in CONTENT_CODES.items()}


# ---- posting -------------------------------------------------------------
def validate_posting(payload):
    """Validate an Insert_Posting body. Returns a clean dict or raises ValidationError.

    Existence of company_id is checked by the service (needs the database).
    """
    errors = _Errors()
    if not isinstance(payload, dict):
        raise ValidationError([{"field": "body", "message": "must be a JSON object"}])

    for k in payload:
        if k in SYSTEM_FIELDS:
            errors.add(k, "is set by the system (new postings start as status P, "
                          "risk_score 0) and cannot be provided")
        elif k not in POSTING_FIELDS:
            errors.add(k, "unknown field")

    cid = payload.get("company_id")
    if cid is None:
        errors.add("company_id", "is required")
    elif not _is_int(cid) or cid < 1:
        errors.add("company_id", "must be a positive integer")
        cid = None

    clean = {
        "company_id": cid,
        "title": _text(errors, payload, "title", 150, required=True),
        "description": _text(errors, payload, "description", 20000),
        "location": _text(errors, payload, "location", 100),
        "employment_type": _code(errors, payload, "employment_type", EMPLOYMENT_TYPES),
    }

    pd = payload.get("posted_date")
    if pd is None:
        clean["posted_date"] = date.today().isoformat()
    else:
        try:
            if not isinstance(pd, str) or not _DATE_RE.match(pd):
                raise ValueError
            date.fromisoformat(pd)
            clean["posted_date"] = pd
        except ValueError:
            errors.add("posted_date", "must be a valid date, format YYYY-MM-DD")

    for key, fn in (("salary_indicators", validate_salary),
                    ("fee_indicators", validate_fee),
                    ("content_indicators", validate_content)):
        clean[key] = fn(payload[key], errors) if payload.get(key) is not None else None

    if errors.items:
        raise ValidationError(errors.items)
    return clean
