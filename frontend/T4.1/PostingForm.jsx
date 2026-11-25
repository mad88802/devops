/**
 * Posting form page.
 *
 * T4.1 — Posting form UI ............ the whole <form> below
 * T4.2 — Client-side validation ..... errors state + validatePostingValues()
 * T4.3 — Connect form to Posting API  submit() -> api.postings.create/check
 *
 * Related files:
 *   shared/fields.js            field catalogue that drives the sections (T4.1)
 *   components/Field.jsx        input / segmented controls (T4.1, T4.2)
 *   lib/postingPayload.js       validation + payload building (T4.2, T4.3)
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FIELD_GROUPS, FIELD_INDEX, defaultPostingInput, describeValue } from './fields.js'
import { RULE_BY_CODE, evaluateCheck } from '../T5.2/rules.js'
import { api } from '../src/api/client.js'
import { FormField } from './FormField.jsx'
import { Icon } from '../src/components/Icon.jsx'
import { RiskRuler } from '../T5.3/RiskRuler.jsx'
import { Notice } from '../src/components/Small.jsx'
import { useAuth } from '../src/context/AuthContext.jsx'
import { useToast } from '../src/context/ToastContext.jsx'
import { useI18n } from '../src/i18n/index.jsx'
import { statusLabel, statusTone } from '../src/lib/format.js'
import { buildPayload, factsForPreview } from '../T4.3/postingPayload.js'
import { validatePostingValues } from '../T4.2/postingValidation.js'
import { useAsync } from '../src/lib/useAsync.js'

const COMPANY_FACT_FIELDS = [
  'company.hasProfile',
  'company.websiteVerified',
  'company.ageYears',
  'company.postingsLast24h',
  'company.fakePostingsCount',
]

export function PostingForm() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState(defaultPostingInput)
  const [companyMode, setCompanyMode] = useState('existing')
  const [companyId, setCompanyId] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const companies = useAsync(() => api.companies.list(), [])
  const companyList = companies.data?.items ?? []

  useEffect(() => {
    if (companyMode === 'existing' && !companyId && companyList.length > 0) {
      setCompanyId(companyList[0].id)
    }
  }, [companyMode, companyId, companyList])

  const selectedCompany = companyList.find((company) => company.id === Number(companyId)) ?? null
  const previewCompany = companyMode === 'existing' ? selectedCompany : null

  const preview = useMemo(
    () => evaluateCheck(factsForPreview(values, { company: previewCompany })),
    [values, previewCompany],
  )

  function setValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  /** Human label for a field key, used by the error summary. */
  function labelFor(key) {
    const field = FIELD_INDEX[key]
    return field ? t(field.label) : key
  }

  /** Scroll the named field into view and put the cursor in it. */
  function focusField(key) {
    const wrapper = document.getElementById(`field-${key.replace(/\./g, '-')}`)
    if (!wrapper) return
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const control = wrapper.querySelector('input, select, textarea, button')
    control?.focus({ preventScroll: true })
  }

  // T4.2 + T4.3 — validate locally first, then POST the payload. The server
  // repeats the same checks and stays authoritative.
  async function submit(event, { andCheck }) {
    event?.preventDefault?.()
    const creatingCompany = companyMode === 'new'
    const found = validatePostingValues(values, { creatingCompany })

    if (Object.keys(found).length > 0) {
      const keys = Object.keys(found)
      setErrors(found)
      push({
        tone: 'error',
        title: t('error.validation'),
        body: t('form.errors', { count: keys.length }),
      })
      // Put the reader on the first field that needs attention.
      requestAnimationFrame(() => focusField(keys[0]))
      return
    }

    setSaving(true)
    try {
      // T4.3 — build the API payload, create the posting, optionally run the check.
      const payload = buildPayload(values, { companyMode, companyId })
      const created = await api.postings.create({ ...payload, recruiterId: user.id })
      let posting = created.posting

      if (andCheck) {
        const checked = await api.postings.check(posting.id, user.id)
        posting = checked.posting
      }

      push({
        tone: 'success',
        title: t('form.created'),
        body: t('form.createdBody', { title: posting.title }),
      })
      // Back to the list so the recruiter can see the posting they just added.
      navigate('/recruiter/inbox', { replace: true })
    } catch (error) {
      if (error.fields) {
        setErrors(error.fields)
        const first = Object.keys(error.fields)[0]
        if (first) requestAnimationFrame(() => focusField(first))
      }
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setSaving(false)
    }
  }

  const errorCount = Object.keys(errors).length
  const missingKeys = Object.keys(errors).filter((key) => errors[key] === 'error.required')
  const invalidKeys = Object.keys(errors).filter((key) => errors[key] !== 'error.required')
  const tone = statusTone(preview.status)

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t('form.title')}</h1>
          <p>{t('form.sub')}</p>
        </div>
      </div>

      {errorCount > 0 ? (
        <Notice tone="danger" icon="alert" style={{ marginBottom: 14 }}>
          <div className="formerrors">
            <b>{t('form.errors', { count: errorCount })}</b>

            {missingKeys.length > 0 ? (
              <div className="formerrors__group">
                <span className="formerrors__label">{t('form.missing')}</span>
                <span className="formerrors__chips">
                  {missingKeys.map((key) => (
                    <button
                      type="button"
                      key={key}
                      className="formerrors__chip"
                      onClick={() => focusField(key)}
                    >
                      {labelFor(key)}
                    </button>
                  ))}
                </span>
              </div>
            ) : null}

            {invalidKeys.length > 0 ? (
              <div className="formerrors__group">
                <span className="formerrors__label">{t('form.invalid')}</span>
                <span className="formerrors__chips">
                  {invalidKeys.map((key) => (
                    <button
                      type="button"
                      key={key}
                      className="formerrors__chip"
                      onClick={() => focusField(key)}
                    >
                      {labelFor(key)}
                    </button>
                  ))}
                </span>
              </div>
            ) : null}
          </div>
        </Notice>
      ) : null}

      {/* T4.1 — posting form: one section per field group in shared/fields.js. */}
      <form className="formgrid" onSubmit={(event) => submit(event, { andCheck: true })} noValidate>
        <div>
          {FIELD_GROUPS.map((group) => {
            if (group.key === 'company') {
              return (
                <section className="card formsection" key={group.key}>
                  <div className="formsection__head">
                    <h2>{t(group.label)}</h2>
                    <span className="formsection__note">{group.note ? t(group.note) : null}</span>
                  </div>

                  <div style={{ padding: '16px 18px 8px' }}>
                    <div className="field">
                      <span className="field__label">{t('form.existingCompany')}</span>
                      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <select
                          className="select"
                          value={companyMode === 'existing' ? companyId : ''}
                          disabled={companyMode === 'new'}
                          aria-label={t('field.company.name')}
                          onChange={(event) => setCompanyId(Number(event.target.value))}
                        >
                          {companyMode === 'new' ? (
                            <option value="">{t('form.newCompany')}</option>
                          ) : (
                            companyList.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name} — {company.country}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => setCompanyMode((mode) => (mode === 'existing' ? 'new' : 'existing'))}
                        >
                          {companyMode === 'existing' ? t('form.newCompany') : t('form.existingCompany')}
                        </button>
                      </div>
                      <span className="field__help">{t('form.companyHint')}</span>
                    </div>

                    {companyMode === 'existing' && selectedCompany ? (
                      <div
                        style={{
                          marginTop: 12,
                          border: '1px solid var(--line-soft)',
                          borderRadius: 'var(--r-md)',
                          padding: '4px 12px',
                          background: 'var(--surface-raised)',
                        }}
                      >
                        {COMPANY_FACT_FIELDS.map((key) => {
                          const field = FIELD_INDEX[key]
                          const value = selectedCompany[key.split('.')[1]]
                          const coded = field.type === 'coded'
                          return (
                            <div className="indrow" key={key}>
                              <span className="indrow__label">{t(field.label)}</span>
                              <span className="indrow__value">
                                {coded ? (
                                  <>
                                    <span className="indrow__code">{value}</span>
                                    <span className="indrow__meaning">
                                      {describeValue(key, value, t)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="mono">{value}</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>

                  {companyMode === 'new' ? (
                    <div className="fields">
                      {group.fields
                        .filter((field) => field.key !== 'company.fakePostingsCount')
                        .map((field) => (
                          <FormField
                            key={field.key}
                            field={field}
                            value={values[field.key]}
                            onChange={(value) => setValue(field.key, value)}
                            error={errors[field.key]}
                          />
                        ))}
                    </div>
                  ) : null}
                </section>
              )
            }

            return (
              <section className="card formsection" key={group.key}>
                <div className="formsection__head">
                  <h2>{t(group.label)}</h2>
                  <span className="formsection__note">{group.note ? t(group.note) : null}</span>
                </div>
                <div className="fields">
                  {group.fields.map((field) => (
                    <FormField
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      onChange={(value) => setValue(field.key, value)}
                      error={errors[field.key]}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <div className="card" style={{ marginTop: 14 }}>
            <div
              className="formactions"
              style={{ borderTop: 'none', borderRadius: 'var(--r-md)' }}
            >
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <Icon name="check" size={14} />}
                {t('form.saveAndCheck')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={saving}
                onClick={(event) => submit(event, { andCheck: false })}
              >
                {t('form.saveDraft')}
              </button>
              <span className="spacer" />
              <span className="tiny faint">
                {t('detail.priority')} · R1 → R8
              </span>
            </div>
          </div>
        </div>

        {/* T5.2 / T5.3 preview — the same rule trace and risk score the result
            page (T5.1) will show, evaluated client-side before saving. */}
        <aside className="formside" aria-label={t('form.preview.title')}>
          <div className="preview">
            <div className="preview__head">
              <Icon name="scale" size={14} />
              <span className="preview__title">{t('form.preview.title')}</span>
              <span className="spacer" />
              <span className="tiny faint nowrap">{t('form.preview.winner')}</span>
            </div>

            <div className="preview__body">
              <div className="preview__verdict">
                <div style={{ minWidth: 0 }}>
                  <div className={`preview__word preview__word--${tone}`}>
                    {statusLabel(preview.status, t)}
                  </div>
                  <div className="preview__rule">
                    {preview.firedCode
                      ? `${preview.firedCode} · ${RULE_BY_CODE[preview.firedCode].name}`
                      : t('form.preview.nofire')}
                  </div>
                </div>
                <span className="spacer" />
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div className="mono" style={{ fontSize: 26, letterSpacing: '-0.03em' }}>
                    {preview.riskScore}
                  </div>
                  <div className="tiny faint">{t('risk.score')}</div>
                </div>
              </div>

              <RiskRuler score={preview.riskScore} showScale label={t('risk.score')} />

              <div className="preview__list" style={{ marginTop: 14 }}>
                {preview.matchedCodes.length > 0 ? (
                  preview.matchedCodes.map((code) => (
                    <div className="preview__item is-match" key={code}>
                      <span className="dot" />
                      <b>{code}</b>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {RULE_BY_CODE[code].name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="preview__item">{t('form.preview.nofire')}</div>
                )}
              </div>

              <div className="preview__note">{t('form.preview.note')}</div>
            </div>
          </div>

          <Notice icon="info">{t('group.content.note')}</Notice>
        </aside>
      </form>
    </div>
  )
}
