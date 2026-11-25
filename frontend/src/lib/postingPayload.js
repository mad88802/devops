/**
 * Posting-form helpers.
 *
 * T4.2 — validation lives in `T4.2/postingValidation.js`.
 * T4.3 — payload building lives in `T4.3/postingPayload.js`.
 * This path stays as a shim so the form keeps its existing import.
 */
export { validatePostingValues } from '../../T4.2/postingValidation.js'
export { neutralise, factsForPreview, buildPayload } from '../../T4.3/postingPayload.js'
export { FIELD_INDEX } from '../../shared/fields.js'
