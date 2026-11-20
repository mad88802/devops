"""T3.1 - ECA rule repository: rule model and rule loader.

The rules live in a repository (here a JSON file) separate from the application
database, as in the architecture diagram. The loader validates every rule so a
typo in the repository is reported at start-up, not in the middle of a check.
Later (US9) a database-backed repository can replace JsonRuleRepository: the
engine only needs an object with load() -> list[Rule].
"""
import json
import os
import re
from dataclasses import dataclass

from ..validation import CONTENT_CODES, FEE_CODES, SALARY_CODES, STATUSES

DEFAULT_RULES_PATH = os.path.join(os.path.dirname(__file__), "rules.json")

# Participants of the ECA law -> (name, {AttributeInBrief: (db column, allowed codes or None)})
PARTICIPANTS = {
    "P": ("posting", {                                   # US6: Posting_Intf
        "Status": ("status", STATUSES),
        "RiskScore": ("risk_score", None),
    }),
    "Rp": ("report", {                                   # US6: Report_Intf
        "CountReports": ("count_reports", None),
    }),
    "C": ("company", {
        "HasProfile": ("has_profile", (0, 1)),
        "WebsiteVerified": ("website_verified", (0, 1)),
        "Blacklisted": ("blacklisted", (0, 1)),
        "AgeYears": ("age_years", None),
        "PostingsLast24h": ("postings_last_24h", None),
        "FakePostingsCount": ("fake_postings_count", None),
    }),
    "S": ("salary", {
        "SalaryLevel": ("salary_level", SALARY_CODES["salary_level"]),
        "SalaryHidden": ("salary_hidden", SALARY_CODES["salary_hidden"]),
    }),
    "F": ("fee", {
        "FeeRequested": ("fee_requested", FEE_CODES["fee_requested"]),
        "FeeType": ("fee_type", FEE_CODES["fee_type"]),
        "PaymentBeforeInterview": ("payment_before_interview",
                                   FEE_CODES["payment_before_interview"]),
    }),
    "K": ("content", {
        "PersonalInfoRequested": ("personal_info_requested",
                                  CONTENT_CODES["personal_info_requested"]),
        "UrgencyLanguage": ("urgency_language", CONTENT_CODES["urgency_language"]),
        "DescriptionQuality": ("description_quality", CONTENT_CODES["description_quality"]),
        "ContactChannel": ("contact_channel", CONTENT_CODES["contact_channel"]),
    }),
}

OPERATORS = ("=", "!=", "<=", ">=", "<", ">")
KNOWN_TRIGGERS = ("ToCheck", "Report", "CheckCompany", "Insert")
# R.ToCheck (R1-R8), Cd.Report (R9, R10), A.CheckCompany (R11), P.Insert (R12)
ESCALATION_PRIORITIES = ("normal", "high")
_STATUS_RANK = {"F": 0, "S": 1, "L": 2}     # precedence: Fake, then Suspicious, then Legit
# value = an integer code or a quoted text code such as 'F'  (e.g. P.Status != 'F')
_COND_RE = re.compile(r"^\s*([A-Z][a-z]?)\.([A-Za-z0-9]+)\s*(=|!=|<=|>=|<|>)\s*(-?\d+|'[^']*'|\"[^\"]*\")\s*$")


class RuleLoadError(Exception):
    def __init__(self, problems):
        super().__init__("invalid rule repository: " + "; ".join(problems))
        self.problems = problems


@dataclass(frozen=True)
class Condition:
    participant: str      # C, S, F or K
    attribute: str        # name used in the brief, e.g. SalaryLevel
    column: str           # column of the getter result, e.g. salary_level
    op: str
    value: object         # int, or str for text codes such as a status

    def __str__(self):
        return f"{self.participant}.{self.attribute} {self.op} {self.value!r}"


@dataclass(frozen=True)
class Rule:
    id: str
    name: str
    trigger: str
    conditions: tuple
    status: object            # L/S/F; None for a Report rule that only raises the risk
    risk_score: object        # 0-100 for ToCheck rules; None for Report rules
    risk_delta: int = 0       # Report rules: P.RiskScore(P.RiskScore + delta)
    escalate: object = None   # Report rules: None, "normal" or "high" (R.ToCheck(P) request)
    set_blacklisted: object = None   # CheckCompany rules: C.Blacklisted(0 or 1)

    @property
    def sort_key(self):
        """Fake rules first, then Suspicious, then Legit; inside a class the
        highest risk score wins, then the lowest rule number."""
        num = int(re.sub(r"\D", "", self.id) or 0)
        return (_STATUS_RANK.get(self.status, 3), -(self.risk_score or 0), num)


def _parse_condition(text, where, problems):
    m = _COND_RE.match(text) if isinstance(text, str) else None
    if not m:
        problems.append(f"{where}: cannot read condition {text!r} (expected e.g. 'C.HasProfile = 0')")
        return None
    part, attr, op, raw = m.groups()
    value = raw[1:-1] if raw[0] in "'\"" else int(raw)
    if part not in PARTICIPANTS:
        problems.append(f"{where}: unknown participant {part!r} in {text!r}")
        return None
    attrs = PARTICIPANTS[part][1]
    if attr not in attrs:
        problems.append(f"{where}: unknown attribute {part}.{attr}")
        return None
    column, codes = attrs[attr]
    if isinstance(value, str) and op not in ("=", "!="):
        problems.append(f"{where}: text values only work with = and != in {text!r}")
        return None
    if codes is None and isinstance(value, str):
        problems.append(f"{where}: {part}.{attr} is numeric, got text in {text!r}")
        return None
    if codes is not None and value not in codes:
        problems.append(f"{where}: {part}.{attr} cannot be {value} (allowed codes: "
                        + ", ".join(map(str, codes)) + ")")
        return None
    return Condition(part, attr, column, op, value)


def parse_rules(document):
    """Turn the repository document (a dict) into a list of Rule, or raise RuleLoadError."""
    problems = []
    rules, seen = [], set()
    items = document.get("rules") if isinstance(document, dict) else None
    if not isinstance(items, list) or not items:
        raise RuleLoadError(["the repository must contain a non-empty 'rules' list"])
    for i, raw in enumerate(items, 1):
        where = f"rule #{i}" if not isinstance(raw, dict) else f"rule {raw.get('id', '#%d' % i)}"
        if not isinstance(raw, dict):
            problems.append(f"{where}: must be an object")
            continue
        rid = raw.get("id")
        if not isinstance(rid, str) or not re.match(r"^R\d+$", rid):
            problems.append(f"{where}: id must look like 'R1'")
        elif rid in seen:
            problems.append(f"{where}: duplicate id")
        seen.add(rid)
        name = raw.get("name")
        if not isinstance(name, str) or not name:
            problems.append(f"{where}: name is required")
        trigger = raw.get("at_trigger")
        if trigger not in KNOWN_TRIGGERS:
            problems.append(f"{where}: at_trigger must be one of {', '.join(KNOWN_TRIGGERS)}")
        under = raw.get("under")
        conds = []
        if not isinstance(under, list) or not under:
            problems.append(f"{where}: 'under' must be a non-empty list of conditions")
        else:
            conds = [_parse_condition(t, where, problems) for t in under]
        acting = raw.get("acting") if isinstance(raw.get("acting"), dict) else {}
        status, score = acting.get("status"), acting.get("risk_score")
        delta, escalate, set_bl = 0, None, None
        if trigger == "CheckCompany":
            # A.CheckCompany rules (R11): the only action is C.Blacklisted(0/1)
            set_bl = acting.get("blacklisted")
            if set_bl not in (0, 1) or isinstance(set_bl, bool):
                problems.append(f"{where}: acting.blacklisted must be 0 or 1")
                set_bl = None
            if isinstance(under, list) and any(
                    isinstance(t, str) and not t.strip().startswith("C.") for t in under):
                problems.append(f"{where}: a CheckCompany rule can only use company (C.) conditions")
            status = score = None
        elif trigger == "Report":
            # Cd.Report rules: any of status / risk_delta / escalate (at least one)
            if status is not None and (status not in STATUSES or status == "P"):
                problems.append(f"{where}: acting.status must be L, S or F")
            delta = acting.get("risk_delta", 0)
            if not isinstance(delta, int) or isinstance(delta, bool) or not -100 <= delta <= 100:
                problems.append(f"{where}: acting.risk_delta must be an integer from -100 to 100")
                delta = 0
            escalate = acting.get("escalate")
            if escalate is not None and escalate not in ESCALATION_PRIORITIES:
                problems.append(f"{where}: acting.escalate must be one of "
                                + ", ".join(ESCALATION_PRIORITIES))
            if status is None and not delta and escalate is None:
                problems.append(f"{where}: acting needs status, risk_delta or escalate")
            score = None
        else:
            if status not in STATUSES or status == "P":
                problems.append(f"{where}: acting.status must be L, S or F")
            if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 100:
                problems.append(f"{where}: acting.risk_score must be an integer from 0 to 100")
        if not problems or all(not p.startswith(where) for p in problems):
            rules.append(Rule(rid, name, trigger, tuple(conds), status, score, delta, escalate, set_bl))
    if problems:
        raise RuleLoadError(problems)
    return rules


class JsonRuleRepository:
    def __init__(self, path=DEFAULT_RULES_PATH):
        self.path = path

    def load(self):
        try:
            with open(self.path, encoding="utf-8") as f:
                document = json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            raise RuleLoadError([f"cannot read {self.path}: {exc}"])
        return parse_rules(document)
