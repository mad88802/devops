/**
 * ECA rule repository — the eight recruiter rules (R1–R8) and the four rules of
 * the other participants (R9–R12), transcribed from Appendix A.5 and A.6 of
 * LAB PRJ12.
 *
 * This module is imported by the Node mock API (authoritative evaluation) and by
 * the React form (live preview). One implementation, so the preview can never
 * promise a verdict the server will not return.
 *
 * Facts object shape (dotted paths used by the conditions):
 *   {
 *     company: { hasProfile, websiteVerified, blacklisted, ageYears, postingsLast24h, fakePostingsCount },
 *     salary:  { salaryLevel, salaryHidden },
 *     fee:     { feeRequested, feeType, paymentBeforeInterview },
 *     content: { personalInfoRequested, urgencyLanguage, descriptionQuality, contactChannel },
 *     posting: { status, riskScore },
 *     reports: { count }
 *   }
 */

export const OPERATORS = {
  eq: '=',
  neq: '≠',
  gte: '≥',
  gt: '>',
  lte: '≤',
  lt: '<',
}

const OPS = {
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  gte: (a, b) => a >= b,
  gt: (a, b) => a > b,
  lte: (a, b) => a <= b,
  lt: (a, b) => a < b,
}

/**
 * Precedence is the order of this array: Fake rules first (R1–R3), then
 * Suspicious (R4–R7), then Legit (R8). The first rule whose conditions all hold
 * decides the posting; the rest of the trace is kept for the explanation.
 */
export const RULES = [
  {
    code: 'R1',
    name: 'Fake_NoProfile_Salary_Fee',
    group: 'F',
    priority: 1,
    score: 95,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R1.summary',
    conditions: [
      { field: 'company.hasProfile', op: 'eq', value: 0 },
      { field: 'salary.salaryLevel', op: 'eq', value: 2 },
      { field: 'fee.feeRequested', op: 'eq', value: 1 },
    ],
  },
  {
    code: 'R2',
    name: 'Fake_PrepaidFee',
    group: 'F',
    priority: 2,
    score: 90,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R2.summary',
    conditions: [
      { field: 'fee.feeRequested', op: 'eq', value: 1 },
      { field: 'fee.paymentBeforeInterview', op: 'eq', value: 1 },
    ],
  },
  {
    code: 'R3',
    name: 'Fake_SensitiveData',
    group: 'F',
    priority: 3,
    score: 90,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R3.summary',
    conditions: [
      { field: 'content.personalInfoRequested', op: 'eq', value: 2 },
      { field: 'company.websiteVerified', op: 'eq', value: 0 },
    ],
  },
  {
    code: 'R4',
    name: 'Suspicious_TooGoodToBeTrue',
    group: 'S',
    priority: 4,
    score: 65,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R4.summary',
    conditions: [
      { field: 'salary.salaryLevel', op: 'gte', value: 1 },
      { field: 'content.descriptionQuality', op: 'eq', value: 0 },
      { field: 'content.urgencyLanguage', op: 'gte', value: 1 },
    ],
  },
  {
    code: 'R5',
    name: 'Suspicious_AnonymousContact',
    group: 'S',
    priority: 5,
    score: 60,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R5.summary',
    conditions: [
      { field: 'company.hasProfile', op: 'eq', value: 0 },
      { field: 'content.contactChannel', op: 'gte', value: 1 },
    ],
  },
  {
    code: 'R6',
    name: 'Suspicious_BulkPosting',
    group: 'S',
    priority: 6,
    score: 70,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R6.summary',
    conditions: [
      { field: 'company.ageYears', op: 'lt', value: 1 },
      { field: 'company.postingsLast24h', op: 'gt', value: 20 },
    ],
  },
  {
    code: 'R7',
    name: 'Suspicious_OffPlatformContact',
    group: 'S',
    priority: 7,
    score: 55,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R7.summary',
    conditions: [
      { field: 'salary.salaryHidden', op: 'eq', value: 1 },
      { field: 'content.contactChannel', op: 'eq', value: 2 },
      { field: 'fee.feeRequested', op: 'eq', value: 0 },
    ],
  },
  {
    code: 'R8',
    name: 'Legit_Verified',
    group: 'L',
    priority: 8,
    score: 10,
    trigger: 'R.ToCheck(P, Infos)',
    participant: 'Recruiter',
    summary: 'rule.R8.summary',
    conditions: [
      { field: 'company.hasProfile', op: 'eq', value: 1 },
      { field: 'company.websiteVerified', op: 'eq', value: 1 },
      { field: 'salary.salaryLevel', op: 'eq', value: 0 },
      { field: 'fee.feeRequested', op: 'eq', value: 0 },
      { field: 'content.personalInfoRequested', op: 'eq', value: 0 },
    ],
  },
]

/** Rules of the other participants. Applied by their own triggers, not by ToCheck. */
export const REPORT_RULES = [
  {
    code: 'R9',
    name: 'Escalate_Reported_Posting',
    group: 'S',
    priority: 9,
    score: 0,
    trigger: 'Cd.Report(P, Reason)',
    participant: 'Candidate',
    summary: 'rule.R9.summary',
    conditions: [
      { field: 'reports.count', op: 'gte', value: 3 },
      { field: 'posting.status', op: 'neq', value: 'F' },
    ],
    actions: [
      { type: 'status', value: 'S' },
      { type: 'recheck' },
    ],
  },
  {
    code: 'R10',
    name: 'Raise_Risk_On_Many_Reports',
    group: 'S',
    priority: 10,
    score: 0,
    trigger: 'Cd.Report(P, Reason)',
    participant: 'Candidate',
    summary: 'rule.R10.summary',
    conditions: [{ field: 'reports.count', op: 'gte', value: 5 }],
    actions: [
      { type: 'riskAdd', value: 20 },
      { type: 'recheck' },
    ],
  },
]

export const COMPANY_RULES = [
  {
    code: 'R11',
    name: 'Blacklist_Repeat_Offender',
    group: 'F',
    priority: 11,
    score: 0,
    trigger: 'A.CheckCompany(C)',
    participant: 'IT_Admin',
    summary: 'rule.R11.summary',
    conditions: [{ field: 'company.fakePostingsCount', op: 'gte', value: 3 }],
    actions: [{ type: 'blacklist', value: 1 }],
  },
]

export const INSERT_RULES = [
  {
    code: 'R12',
    name: 'Reject_Blacklisted_Company',
    group: 'F',
    priority: 12,
    score: 100,
    trigger: 'P.Insert(Infos)',
    participant: 'IT_Admin',
    summary: 'rule.R12.summary',
    conditions: [{ field: 'company.blacklisted', op: 'eq', value: 1 }],
    actions: [
      { type: 'status', value: 'F' },
      { type: 'risk', value: 100 },
    ],
  },
]

export const ALL_RULES = [...RULES, ...REPORT_RULES, ...COMPANY_RULES, ...INSERT_RULES]

export const RULE_BY_CODE = ALL_RULES.reduce((acc, rule) => {
  acc[rule.code] = rule
  return acc
}, {})

/** Read a dotted path out of the facts object. */
function readFacts(facts, path) {
  return path.split('.').reduce((node, part) => (node == null ? undefined : node[part]), facts)
}

/** Evaluate a single condition against the facts, keeping the actual value. */
export function testCondition(facts, condition) {
  const actual = readFacts(facts, condition.field)
  const compare = OPS[condition.op]
  const pass = compare ? compare(actual, condition.value) : false
  return { ...condition, actual, pass }
}

/** Evaluate one rule: every condition must hold. */
export function evaluateRule(rule, facts) {
  const conditions = rule.conditions.map((c) => testCondition(facts, c))
  return {
    code: rule.code,
    name: rule.name,
    group: rule.group,
    priority: rule.priority,
    score: rule.score,
    summary: rule.summary,
    trigger: rule.trigger,
    participant: rule.participant,
    actions: rule.actions ?? [
      { type: 'status', value: rule.group },
      { type: 'risk', value: rule.score },
    ],
    conditions,
    matched: conditions.length > 0 && conditions.every((c) => c.pass),
    failedCount: conditions.filter((c) => !c.pass).length,
  }
}

export function evaluateRules(rules, facts) {
  return rules.map((rule) => evaluateRule(rule, facts))
}

/**
 * The recruiter's ToCheck: evaluate R1–R8 by precedence, first match wins.
 *
 * Risk score is monotonic on purpose. A re-check never lowers the score a
 * candidate's reports have pushed up (R10 adds +20), so an escalation cannot be
 * silently erased by running the rule engine again. The verdict itself is always
 * recomputed from the rules; nothing matching leaves the posting Pending.
 */
export function evaluateCheck(facts) {
  const trace = evaluateRules(RULES, facts)
  const fired = trace.find((entry) => entry.matched) ?? null
  const previousScore = Number(facts?.posting?.riskScore ?? 0)

  return {
    trace,
    fired,
    firedCode: fired ? fired.code : null,
    status: fired ? fired.group : 'P',
    riskScore: Math.min(100, Math.max(fired ? fired.score : 0, previousScore)),
    previousScore,
    matchedCodes: trace.filter((entry) => entry.matched).map((entry) => entry.code),
  }
}

/** R9 / R10 — applied after a candidate files a report. */
export function evaluateReportEvent(facts) {
  const trace = evaluateRules(REPORT_RULES, facts)
  return {
    trace,
    fired: trace.filter((entry) => entry.matched),
  }
}

/** R11 — an IT admin asks the system to check a company. */
export function evaluateCompanyEvent(company) {
  const facts = { company }
  const trace = evaluateRules(COMPANY_RULES, facts)
  return { trace, fired: trace.find((entry) => entry.matched) ?? null }
}

/** R12 — a posting is inserted for a company that is already blacklisted. */
export function evaluateInsertEvent(company) {
  const facts = { company }
  const trace = evaluateRules(INSERT_RULES, facts)
  return { trace, fired: trace.find((entry) => entry.matched) ?? null }
}

/** Rule codes that could fire for a given group, used by filters. */
export function rulesForGroup(group) {
  return RULES.filter((rule) => rule.group === group)
}
