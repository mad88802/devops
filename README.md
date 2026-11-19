# T3.3 ToCheck orchestration and Status update
Branch: `T3.3-tocheck-orchestration`

POST /api/postings/<id>/check   (optional body: {"recruiter_id": n})
1. reload rules from the repository, load the posting (404 if missing)
2. evaluate R1..R8 through the engine
3. rule fired  -> posting_service.set_status(status, risk_score) + INSERT classification_result, ONE transaction (rollback on error)
4. no rule fired -> posting untouched (stays P for manual review), `updated: false`
Response: status, risk_score, rule_id, rule_name, matched_rules, missing_indicators, message (feeds US5 result page).
app/__init__.py : registers the check blueprint and the RuleLoadError (500) handler.
Depends on: posting_service.set_status (T2.1), T3.1, T3.2.
