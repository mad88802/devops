/**
 * Coded-value catalogue for the Fake Job Posting Detection domain.
 *
 * Every property that the lab document codes as a number (Appendix A.4) is
 * described here exactly once. The Node mock API validates against it and the
 * React UI renders it, so a new code can never mean two different things in
 * two different places.
 *
 * A field descriptor looks like:
 *   {
 *     key       'company.hasProfile'      dotted path, matches the rule facts
 *     group     'company'                 form section / dossier section
 *     label     'field.company.hasProfile' i18n key
 *     type      'coded' | 'text' | 'textarea' | 'number' | 'date' | 'select'
 *     options   [{ value, label }]         for coded / select
 *     dependsOn { field, equals }          hide + neutralise when the parent differs
 *   }
 */

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'DZD', 'AED', 'CAD']

export const STATUS_META = {
  P: { code: 'P', label: 'status.P', tone: 'pending', short: 'status.P.short' },
  L: { code: 'L', label: 'status.L', tone: 'legit', short: 'status.L.short' },
  S: { code: 'S', label: 'status.S', tone: 'suspicious', short: 'status.S.short' },
  F: { code: 'F', label: 'status.F', tone: 'fake', short: 'status.F.short' },
}

export const STATUS_ORDER = ['P', 'S', 'L', 'F']

/** Report reasons. The lab fixes Reason: Int(1..4) but does not name the four values. */
export const REPORT_REASONS = [
  { value: 1, label: 'reason.1' },
  { value: 2, label: 'reason.2' },
  { value: 3, label: 'reason.3' },
  { value: 4, label: 'reason.4' },
]

/** Recruiter.Role: Char("R","P","S") in the class model, meanings not stated in the lab. */
export const RECRUITER_ROLES = [
  { value: 'R', label: 'role.R' },
  { value: 'P', label: 'role.P' },
  { value: 'S', label: 'role.S' },
]

const binary = (field, no, yes) => [
  { value: 0, label: `opt.${field}.0` },
  { value: 1, label: `opt.${field}.1` },
]

export const FIELD_GROUPS = [
  {
    key: 'posting',
    label: 'group.posting',
    note: 'group.posting.note',
    fields: [
      {
        key: 'posting.title',
        group: 'posting',
        label: 'field.posting.title',
        type: 'text',
        maxLength: 150,
        required: true,
        wide: true,
      },
      {
        key: 'posting.location',
        group: 'posting',
        label: 'field.posting.location',
        type: 'text',
        maxLength: 100,
        required: true,
      },
      {
        key: 'posting.employmentType',
        group: 'posting',
        label: 'field.posting.employmentType',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.employmentType.0' },
          { value: 1, label: 'opt.employmentType.1' },
          { value: 2, label: 'opt.employmentType.2' },
        ],
      },
      {
        key: 'posting.postedDate',
        group: 'posting',
        label: 'field.posting.postedDate',
        type: 'date',
        required: true,
      },
      {
        key: 'posting.description',
        group: 'posting',
        label: 'field.posting.description',
        type: 'textarea',
        maxLength: 4000,
        required: true,
        wide: true,
      },
    ],
  },
  {
    key: 'company',
    label: 'group.company',
    note: 'group.company.note',
    fields: [
      {
        key: 'company.name',
        group: 'company',
        label: 'field.company.name',
        type: 'text',
        maxLength: 50,
        required: true,
      },
      {
        key: 'company.country',
        group: 'company',
        label: 'field.company.country',
        type: 'text',
        maxLength: 50,
        required: true,
      },
      {
        key: 'company.industry',
        group: 'company',
        label: 'field.company.industry',
        type: 'text',
        maxLength: 50,
      },
      {
        key: 'company.ageYears',
        group: 'company',
        label: 'field.company.ageYears',
        type: 'number',
        min: 0,
        max: 200,
        required: true,
        default: 1,
      },
      {
        key: 'company.hasProfile',
        group: 'company',
        label: 'field.company.hasProfile',
        type: 'coded',
        required: true,
        default: 1,
        options: binary('company.hasProfile'),
      },
      {
        key: 'company.websiteVerified',
        group: 'company',
        label: 'field.company.websiteVerified',
        type: 'coded',
        required: true,
        default: 1,
        options: binary('company.websiteVerified'),
      },
      {
        key: 'company.postingsLast24h',
        group: 'company',
        label: 'field.company.postingsLast24h',
        type: 'number',
        min: 0,
        max: 9999,
        required: true,
        default: 0,
      },
      {
        key: 'company.fakePostingsCount',
        group: 'company',
        label: 'field.company.fakePostingsCount',
        type: 'number',
        min: 0,
        max: 9999,
        readOnly: true,
        help: 'help.company.fakePostingsCount',
      },
    ],
  },
  {
    key: 'salary',
    label: 'group.salary',
    note: 'group.salary.note',
    fields: [
      {
        key: 'salary.salaryMin',
        group: 'salary',
        label: 'field.salary.salaryMin',
        type: 'number',
        min: 0,
        max: 10000000,
        required: true,
        dependsOn: { field: 'salary.salaryHidden', equals: 0 },
      },
      {
        key: 'salary.salaryMax',
        group: 'salary',
        label: 'field.salary.salaryMax',
        type: 'number',
        min: 0,
        max: 10000000,
        required: true,
        dependsOn: { field: 'salary.salaryHidden', equals: 0 },
      },
      {
        key: 'salary.currency',
        group: 'salary',
        label: 'field.salary.currency',
        type: 'select',
        required: true,
        default: 'USD',
        options: CURRENCIES.map((c) => ({ value: c, label: c, literal: true })),
        dependsOn: { field: 'salary.salaryHidden', equals: 0 },
      },
      {
        key: 'salary.salaryLevel',
        group: 'salary',
        label: 'field.salary.salaryLevel',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.salary.salaryLevel.0' },
          { value: 1, label: 'opt.salary.salaryLevel.1' },
          { value: 2, label: 'opt.salary.salaryLevel.2' },
        ],
      },
      {
        key: 'salary.salaryHidden',
        group: 'salary',
        label: 'field.salary.salaryHidden',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.salary.salaryHidden.0' },
          { value: 1, label: 'opt.salary.salaryHidden.1' },
        ],
      },
    ],
  },
  {
    key: 'fee',
    label: 'group.fee',
    note: 'group.fee.note',
    fields: [
      {
        key: 'fee.feeRequested',
        group: 'fee',
        label: 'field.fee.feeRequested',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.fee.feeRequested.0' },
          { value: 1, label: 'opt.fee.feeRequested.1' },
        ],
      },
      {
        key: 'fee.feeType',
        group: 'fee',
        label: 'field.fee.feeType',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.fee.feeType.0' },
          { value: 1, label: 'opt.fee.feeType.1' },
          { value: 2, label: 'opt.fee.feeType.2' },
          { value: 3, label: 'opt.fee.feeType.3' },
        ],
        dependsOn: { field: 'fee.feeRequested', equals: 1 },
      },
      {
        key: 'fee.paymentBeforeInterview',
        group: 'fee',
        label: 'field.fee.paymentBeforeInterview',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.fee.paymentBeforeInterview.0' },
          { value: 1, label: 'opt.fee.paymentBeforeInterview.1' },
        ],
        dependsOn: { field: 'fee.feeRequested', equals: 1 },
      },
    ],
  },
  {
    key: 'content',
    label: 'group.content',
    note: 'group.content.note',
    fields: [
      {
        key: 'content.personalInfoRequested',
        group: 'content',
        label: 'field.content.personalInfoRequested',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.content.personalInfoRequested.0' },
          { value: 1, label: 'opt.content.personalInfoRequested.1' },
          { value: 2, label: 'opt.content.personalInfoRequested.2' },
        ],
      },
      {
        key: 'content.urgencyLanguage',
        group: 'content',
        label: 'field.content.urgencyLanguage',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.content.urgencyLanguage.0' },
          { value: 1, label: 'opt.content.urgencyLanguage.1' },
          { value: 2, label: 'opt.content.urgencyLanguage.2' },
        ],
      },
      {
        key: 'content.descriptionQuality',
        group: 'content',
        label: 'field.content.descriptionQuality',
        type: 'coded',
        required: true,
        default: 1,
        options: [
          { value: 0, label: 'opt.content.descriptionQuality.0' },
          { value: 1, label: 'opt.content.descriptionQuality.1' },
          { value: 2, label: 'opt.content.descriptionQuality.2' },
        ],
      },
      {
        key: 'content.contactChannel',
        group: 'content',
        label: 'field.content.contactChannel',
        type: 'coded',
        required: true,
        default: 0,
        options: [
          { value: 0, label: 'opt.content.contactChannel.0' },
          { value: 1, label: 'opt.content.contactChannel.1' },
          { value: 2, label: 'opt.content.contactChannel.2' },
        ],
      },
    ],
  },
]

/** Flat index: 'company.hasProfile' -> descriptor */
export const FIELD_INDEX = FIELD_GROUPS.reduce((acc, group) => {
  for (const field of group.fields) acc[field.key] = field
  return acc
}, {})

/** Every field, in form order. */
export const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields)

/** Fields the recruiter form sends to POST /api/postings (coded + descriptive). */
export const POSTING_INPUT_FIELDS = ALL_FIELDS.filter(
  (f) => !f.readOnly && f.key !== 'company.fakePostingsCount',
)

/** Read a dotted path out of a nested facts object. */
export function readPath(object, path) {
  return path.split('.').reduce((node, part) => (node == null ? undefined : node[part]), object)
}

/** Write a dotted path into a nested object, creating the branches. */
export function writePath(object, path, value) {
  const parts = path.split('.')
  let node = object
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (typeof node[parts[i]] !== 'object' || node[parts[i]] === null) node[parts[i]] = {}
    node = node[parts[i]]
  }
  node[parts[parts.length - 1]] = value
  return object
}

/** Human label for a stored code, e.g. ('content.contactChannel', 2) -> "Messaging app only". */
export function describeValue(fieldKey, value, t) {
  const field = FIELD_INDEX[fieldKey]
  if (!field) return String(value ?? '—')
  if (field.type === 'coded' || field.type === 'select') {
    const option = field.options.find((o) => o.value === value)
    if (!option) return String(value ?? '—')
    return option.literal ? option.label : t(option.label)
  }
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/** True when a field's parent selector currently hides it. */
export function isFieldHidden(field, values) {
  if (!field.dependsOn) return false
  return readPath(values, field.dependsOn.field) !== field.dependsOn.equals
}

/**
 * Build the neutral value for a hidden dependent field, so the payload never
 * carries a fee type for a posting that asks for no fee.
 */
export const NEUTRAL_VALUE = {
  'fee.feeType': 0,
  'fee.paymentBeforeInterview': 0,
  'salary.currency': null,
  'salary.salaryMin': null,
  'salary.salaryMax': null,
}

/** Default indicator payload for a new posting. */
export function defaultPostingInput() {
  const values = {}
  for (const field of POSTING_INPUT_FIELDS) {
    if (field.type === 'date') values[field.key] = new Date().toISOString().slice(0, 10)
    else if (field.default !== undefined) values[field.key] = field.default
    else if (field.type === 'number') values[field.key] = 0
    else values[field.key] = ''
  }
  values['salary.salaryMin'] = 1200
  values['salary.salaryMax'] = 1800
  values['company.ageYears'] = 3
  return values
}

/** Risk band used by the risk ruler. */
export function riskBand(score) {
  if (score >= 85) return 'critical'
  if (score >= 55) return 'elevated'
  if (score >= 25) return 'watch'
  return 'low'
}
