# T3.1 ECA rule engine: rule loader and evaluator
Branch: `T3.1-eca-rule-engine`

- repository.py : Rule / Condition model, `parse_rules()` and `JsonRuleRepository.load()`.
  Validates every rule at start-up (participant C/S/F/K, attribute, operator, coded value range,
  status L/S/F, risk 0-100, unique id) and raises RuleLoadError listing all problems.
  Only needs `load() -> list[Rule]`, so a DB-backed repository (US9) can replace it.
- evaluator.py : `PostingContext` fetches C, S, F, K lazily through the US2 getter services (never SQL);
  `evaluate()` returns all fired rules, decision = best one (Fake > Suspicious > Legit, then highest risk, then lowest rule number).
  A condition on a missing indicator block is false (rule does not fire).
Depends on: validation.py and the getter services (US2).
