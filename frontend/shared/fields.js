/**
 * Shared coded-value catalogue for the Fake Job Posting Detection domain.
 *
 * The implementations now live in their task folders:
 *   T4.1 — form field catalogue ....... T4.1/fields.js
 *   T5.3 — status and risk metadata ... T5.3/statusMeta.js
 *   T7.3 — report reasons ............. T7.3/reportReasons.js
 *
 * This module re-exports them so the server, the form and the existing pages
 * keep importing one stable path.
 */

export { STATUS_META, STATUS_ORDER, riskBand } from '../T5.3/statusMeta.js'
export { REPORT_REASONS } from '../T7.3/reportReasons.js'
export {
  CURRENCIES,
  FIELD_GROUPS,
  FIELD_INDEX,
  ALL_FIELDS,
  POSTING_INPUT_FIELDS,
  readPath,
  writePath,
  describeValue,
  isFieldHidden,
  NEUTRAL_VALUE,
  defaultPostingInput,
} from '../T4.1/fields.js'

/** Recruiter.Role: Char("R","P","S") in the class model, meanings not stated in the lab. */
export const RECRUITER_ROLES = [
  { value: 'R', label: 'role.R' },
  { value: 'P', label: 'role.P' },
  { value: 'S', label: 'role.S' },
]
