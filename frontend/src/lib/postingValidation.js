/**
 * T4.2 — Client-side validation for the posting form.
 *
 * The server repeats every check and stays authoritative (`server/validate.js`).
 * `src/lib/postingPayload.js` re-exports this function so the form keeps its
 * existing import path.
 */
import { CURRENCIES, POSTING_INPUT_FIELDS, isFieldHidden } from './fields.js'

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
