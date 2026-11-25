/**
 * Client-side validation and payload building for the posting form.
 *
 * The lab asks for client validation (T4.2), so the recruiter gets immediate
 * feedback. The server repeats every check and stays authoritative: these two
 * implementations agree on the rules but the server decides.
 */
import {
  CURRENCIES,
  FIELD_INDEX,
  POSTING_INPUT_FIELDS,
  isFieldHidden,
} from './fields.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function blank(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

export function validatePostingValues(values, { creatingCompany }) {
  const errors = {}

  for (const field of POSTING_INPUT_FIELDS) {
    if (field.readOnly) continue
    if (isFieldHidden(field, values)) continue

    const value = values[field.key]

    if (field.type === 'coded') {
      if (blank(value)) {
        if (field.required) errors[field.key] = 'error.required'
      } else if (!field.options.some((option) => option.value === Number(value))) {
        errors[field.key] = 'error.coded'
      }
      continue
    }

    if (field.type === 'select') {
      if (blank(value)) {
        if (field.required) errors[field.key] = 'error.required'
      } else if (!field.options.some((option) => option.value === value)) {
        errors[field.key] = 'error.coded'
      }
      continue
    }

    if (field.type === 'number') {
      if (blank(value)) {
        if (field.required) errors[field.key] = 'error.required'
      } else if (!Number.isFinite(Number(value))) {
        errors[field.key] = 'error.number'
      } else {
        const numeric = Number(value)
        if (field.min !== undefined && numeric < field.min) errors[field.key] = 'error.min'
        if (field.max !== undefined && numeric > field.max) errors[field.key] = 'error.max'
      }
      continue
    }

    if (field.type === 'date') {
      if (blank(value)) {
        if (field.required) errors[field.key] = 'error.required'
      } else if (!DATE_RE.test(String(value))) {
        errors[field.key] = 'error.date'
      }
      continue
    }

    if (blank(value)) {
      if (field.required) errors[field.key] = 'error.required'
    } else if (field.maxLength && String(value).length > field.maxLength) {
      errors[field.key] = 'error.maxLength'
    }
  }

  if (creatingCompany) {
    if (blank(values['company.name'])) errors['company.name'] = 'error.required'
    if (blank(values['company.country'])) errors['company.country'] = 'error.required'
  }

  const hidden = Number(values['salary.salaryHidden']) === 1
  if (!hidden) {
    const min = values['salary.salaryMin']
    const max = values['salary.salaryMax']
    if (!blank(min) && !blank(max) && Number(max) < Number(min)) {
      errors['salary.salaryMax'] = 'error.salaryRange'
    }
    if (!blank(values['salary.currency']) && !CURRENCIES.includes(values['salary.currency'])) {
      errors['salary.currency'] = 'error.coded'
    }
  }

  return errors
}

/** A hidden dependent field must not travel: no fee implies no fee type. */
export function neutralise(values) {
  const clean = { ...values }
  if (Number(clean['fee.feeRequested']) !== 1) {
    clean['fee.feeType'] = 0
    clean['fee.paymentBeforeInterview'] = 0
  }
  if (Number(clean['salary.salaryHidden']) === 1) {
    clean['salary.salaryMin'] = null
    clean['salary.salaryMax'] = null
    clean['salary.currency'] = null
  }
  return clean
}

/**
 * Facts for the live preview. Company indicators come from the selected company
 * record when one is chosen, because that is what the server will read.
 */
export function factsForPreview(values, { company }) {
  const clean = neutralise(values)
  return {
    company: company
      ? {
          hasProfile: company.hasProfile,
          websiteVerified: company.websiteVerified,
          blacklisted: company.blacklisted,
          ageYears: company.ageYears,
          postingsLast24h: company.postingsLast24h,
          fakePostingsCount: company.fakePostingsCount,
        }
      : {
          hasProfile: Number(clean['company.hasProfile'] ?? 0),
          websiteVerified: Number(clean['company.websiteVerified'] ?? 0),
          blacklisted: 0,
          ageYears: Number(clean['company.ageYears'] ?? 0),
          postingsLast24h: Number(clean['company.postingsLast24h'] ?? 0),
          fakePostingsCount: 0,
        },
    salary: {
      salaryLevel: Number(clean['salary.salaryLevel'] ?? 0),
      salaryHidden: Number(clean['salary.salaryHidden'] ?? 0),
    },
    fee: {
      feeRequested: Number(clean['fee.feeRequested'] ?? 0),
      feeType: Number(clean['fee.feeType'] ?? 0),
      paymentBeforeInterview: Number(clean['fee.paymentBeforeInterview'] ?? 0),
    },
    content: {
      personalInfoRequested: Number(clean['content.personalInfoRequested'] ?? 0),
      urgencyLanguage: Number(clean['content.urgencyLanguage'] ?? 0),
      descriptionQuality: Number(clean['content.descriptionQuality'] ?? 1),
      contactChannel: Number(clean['content.contactChannel'] ?? 0),
    },
    posting: { status: 'P', riskScore: 0 },
    reports: { count: 0 },
  }
}

export function buildPayload(values, { companyMode, companyId }) {
  const clean = neutralise(values)

  return {
    posting: {
      title: clean['posting.title'],
      description: clean['posting.description'],
      location: clean['posting.location'],
      employmentType: clean['posting.employmentType'],
      postedDate: clean['posting.postedDate'],
    },
    company:
      companyMode === 'existing'
        ? { companyId }
        : {
            name: clean['company.name'],
            country: clean['company.country'],
            industry: clean['company.industry'],
            ageYears: clean['company.ageYears'],
            hasProfile: clean['company.hasProfile'],
            websiteVerified: clean['company.websiteVerified'],
            postingsLast24h: clean['company.postingsLast24h'],
          },
    salary: {
      salaryMin: clean['salary.salaryMin'],
      salaryMax: clean['salary.salaryMax'],
      currency: clean['salary.currency'],
      salaryLevel: clean['salary.salaryLevel'],
      salaryHidden: clean['salary.salaryHidden'],
    },
    fee: {
      feeRequested: clean['fee.feeRequested'],
      feeType: clean['fee.feeType'],
      paymentBeforeInterview: clean['fee.paymentBeforeInterview'],
    },
    content: {
      personalInfoRequested: clean['content.personalInfoRequested'],
      urgencyLanguage: clean['content.urgencyLanguage'],
      descriptionQuality: clean['content.descriptionQuality'],
      contactChannel: clean['content.contactChannel'],
    },
  }
}

export { FIELD_INDEX }
