"""Regenerate the eca_rule / eca_rule_condition seed from engine/rules.json.

    python tools/generate_rules_seed.py > rules_seed.sql

Uses the same loader as the application, so an invalid rule file fails here too.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.engine.repository import DEFAULT_RULES_PATH, JsonRuleRepository   # noqa: E402


def sql(v):
    if v is None:
        return "NULL"
    return "'" + v + "'" if isinstance(v, str) else str(int(v))


def main():
    rules = JsonRuleRepository(DEFAULT_RULES_PATH).load()
    print("-- ECA rules R1-R12 (generated from engine/rules.json)")
    print("INSERT INTO eca_rule (rule_id, name, at_trigger, active, act_status, act_risk_score,\n"
          "                      act_risk_delta, act_escalate, act_blacklisted) VALUES")
    rows = [f" ({sql(r.id)}, {sql(r.name)}, {sql(r.trigger)}, 1, {sql(r.status)}, {sql(r.risk_score)}, "
            f"{r.risk_delta}, {sql(r.escalate)}, {sql(r.set_blacklisted)})" for r in rules]
    print(",\n".join(rows) + ";\n")
    print("INSERT INTO eca_rule_condition (rule_id, seq, participant, attribute, op, value_int, value_text) VALUES")
    cond = []
    for r in rules:
        for i, c in enumerate(r.conditions, 1):
            is_text = isinstance(c.value, str)
            cond.append(f" ({sql(r.id)}, {i}, {sql(c.participant)}, {sql(c.attribute)}, {sql(c.op)}, "
                        f"{'NULL' if is_text else c.value}, {sql(c.value) if is_text else 'NULL'})")
    print(",\n".join(cond) + ";")


if __name__ == "__main__":
    main()
