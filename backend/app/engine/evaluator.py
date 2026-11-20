"""T3.1 - ECA rule evaluator (T6.2: also reads P and Rp for the Report trigger).

The participants of a rule (C, S, F, K) are read ONLY through the getter services
of US2 (Company_Intf, Salary_Intf, Fee_Intf, Content_Intf), never with SQL.
"""
import operator
from dataclasses import dataclass, field

from ..errors import NotFoundError
from ..services import company_service, indicator_service, posting_service, report_service

_OPS = {"=": operator.eq, "!=": operator.ne, "<": operator.lt,
        "<=": operator.le, ">": operator.gt, ">=": operator.ge}


class PostingContext:
    """The participants of one posting, fetched lazily and only once."""

    def __init__(self, conn, posting_id, company_id):
        self._conn = conn
        self._posting_id = posting_id
        self._company_id = company_id
        self._cache = {}
        self.missing = []        # participants a rule needed but the posting does not have

    def participant(self, key):
        if key not in self._cache:
            try:
                if key == "P":
                    value = posting_service.get_posting(self._conn, self._posting_id)
                elif key == "Rp":
                    value = {"count_reports": report_service.count_reports(self._conn, self._posting_id)}
                elif key == "C":
                    value = company_service.get_company(self._conn, self._company_id)
                elif key == "S":
                    value = indicator_service.get_salary(self._conn, self._posting_id)
                elif key == "F":
                    value = indicator_service.get_fee(self._conn, self._posting_id)
                else:
                    value = indicator_service.get_content(self._conn, self._posting_id)
            except NotFoundError:
                value = None
            self._cache[key] = value
            if value is None:
                self.missing.append(key)
        return self._cache[key]


@dataclass
class Evaluation:
    fired: list = field(default_factory=list)     # matching rules, best first
    missing: list = field(default_factory=list)   # S/F/K blocks that were needed but absent

    @property
    def decision(self):
        return self.fired[0] if self.fired else None


def condition_holds(cond, ctx):
    """A condition on a participant the posting does not have is never true:
    without the data we cannot confirm the rule, so it does not fire."""
    data = ctx.participant(cond.participant)
    if data is None or data.get(cond.column) is None:
        return False
    return _OPS[cond.op](data[cond.column], cond.value)


def rule_fires(rule, ctx):
    return all(condition_holds(c, ctx) for c in rule.conditions)


def evaluate(rules, ctx, trigger="ToCheck"):
    """Evaluate every rule of this trigger; the decision is the best matching rule
    (Fake before Suspicious before Legit, then highest risk score)."""
    fired = [r for r in rules if r.trigger == trigger and rule_fires(r, ctx)]
    fired.sort(key=lambda r: r.sort_key)
    return Evaluation(fired=fired, missing=sorted(set(ctx.missing)))
