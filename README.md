# T9.1 Rule repository table and schema
Branch: `T9.1-rule-repository-schema`

Replace `database/schema.sql` and `database/seed.sql` with these versions (they include everything from US1-US8).
For an existing database run only the two new CREATE TABLE statements, the index, and the rules INSERTs.

## Tables
**eca_rule** - one row per rule: rule_id (PK 'R1'..'R12'), name (unique), at_trigger (ToCheck / Report / CheckCompany / Insert),
active (0/1: switch a rule off without deleting it), acting columns act_status (L/S/F), act_risk_score (0-100),
act_risk_delta (-100..100), act_escalate (normal/high), act_blacklisted (0/1), updated_at.
A table-level CHECK keeps the acting part coherent: ToCheck/Insert need status + score, CheckCompany needs act_blacklisted,
Report needs at least one of status / risk delta / escalate.

**eca_rule_condition** - the "under" conditions (a conjunction), one row each: rule_id (FK, ON DELETE CASCADE), seq (order),
participant (C, S, F, K, P, Rp), attribute (name from the brief, e.g. SalaryLevel), op (=, !=, <, <=, >, >=),
value_int OR value_text (exactly one, e.g. 'F' for P.Status != 'F'). UNIQUE (rule_id, seq).

## Seed
R1-R12 (12 rules, 27 conditions) generated from `engine/rules.json` by `tools/generate_rules_seed.py`
(`python tools/generate_rules_seed.py > rules_seed.sql`, run from the repo root).

## What the database does NOT check
Whether an attribute exists for its participant (e.g. `S.Foo`) or a coded value is in range (e.g. `SalaryLevel = 7`):
that validation stays in the rule loader (engine/repository.py), which T9.2 reuses when loading from the database.

## Classification history
Already stored in table `classification_result` (written by ToCheck, R9, R10, R12) - T9.3 builds on it.
