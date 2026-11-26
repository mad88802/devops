/**
 * Posting result / case-file page.
 *
 * T5.1 — Result page UI ................ header + indicator dossier + tabs
 * T5.2 — Fired rule and explanation .... trace, RuleCard list, verdict side
 *                                        panel (ConditionLedger + ActionTokens)
 * T5.3 — Status badges and risk score .. StatusBadge, RiskRuler, verdict block
 *
 * The candidate-facing variant of the same result view is
 * src/pages/candidate/PostingView.jsx.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FIELD_INDEX, STATUS_META, describeValue, readPath } from '../../lib/fields.js'
import { evaluateCheck } from '../../lib/rules.js'
import { api } from '../../api/client.js'
import { Segmented } from '../../components/FormField.jsx'
import { Icon } from '../../components/Icon.jsx'
import { ActionTokens, ConditionLedger } from '../../components/ConditionLedger.jsx'
import { ConfirmDialog, Modal } from '../../components/Modal.jsx'
import { RiskRuler } from '../../components/RiskRuler.jsx'
import { RuleCard } from '../../components/RuleCard.jsx'
import { Empty, Notice, Tabs } from '../../components/Small.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { relativeDays, statusLabel, statusTone } from '../../lib/format.js'
import { useAsync } from '../../lib/useAsync.js'

const INDICATOR_FIELDS = {
  salary: ['salary.salaryLevel', 'salary.salaryHidden', 'salary.salaryMin', 'salary.salaryMax', 'salary.currency'],
  fee: ['fee.feeRequested', 'fee.feeType', 'fee.paymentBeforeInterview'],
  content: [
    'content.personalInfoRequested',
    'content.urgencyLanguage',
    'content.descriptionQuality',
    'content.contactChannel',
  ],
  company: [
    'company.hasProfile',
    'company.websiteVerified',
    'company.ageYears',
    'company.postingsLast24h',
    'company.fakePostingsCount',
    'company.blacklisted',
  ],
}

const GROUP_LABEL = {
  salary: 'group.salary',
  fee: 'group.fee',
  content: 'group.content',
  company: 'group.company',
}

function IndicatorBlock({ groupKey, posting, t }) {
  return (
    <div className="indblock">
      <div className="indblock__head">
        <h3>{t(GROUP_LABEL[groupKey])}</h3>
      </div>
      {INDICATOR_FIELDS[groupKey].map((key) => {
        const field = FIELD_INDEX[key]
        if (!field) return null
        const value = readPath(posting, key)
        const coded = field.type === 'coded'
        const money = key === 'salary.salaryMin' || key === 'salary.salaryMax'
        const hidden = Number(posting.salary?.salaryHidden ?? posting.salary?.salary_hidden) === 1

        return (
          <div className="indrow" key={key}>
            <span className="indrow__label">{field.label ? t(field.label) : key}</span>
            <span className="indrow__value">
              {money ? (
                <span className="mono">
                  {hidden || value == null
                    ? '—'
                    : `${new Intl.NumberFormat().format(value)} ${posting.salary?.currency ?? ''}`}
                </span>
              ) : coded ? (
                <>
                  <span className="indrow__code">{value ?? '—'}</span>
                  <span className="indrow__meaning">{describeValue(key, value, t)}</span>
                </>
              ) : (
                <span className="mono">{value ?? '—'}</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function PostingDetail() {
  const { id } = useParams()
  const { t } = useI18n()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState('indicators')
  const [checking, setChecking] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideStatus, setOverrideStatus] = useState('F')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideSaving, setOverrideSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const detail = useAsync(() => api.postings.get(id), [id])

  const posting = detail.data?.posting
  const facts = detail.data?.facts

  // T5.2 — the full R1–R8 trace, re-evaluated client-side from the stored facts.
  const trace = useMemo(() => (facts ? evaluateCheck(facts) : null), [facts])

  async function recheck() {
    setChecking(true)
    try {
      const response = await api.postings.check(id, user.id)
      await detail.reload()
      if (response.result.firedCode) {
        push({
          tone: response.result.status === 'L' ? 'success' : 'warn',
          title: t('toast.checked', { rule: response.result.firedCode }),
          body: t('toast.checkedBody', {
            status: statusLabel(response.result.status, t),
            score: response.result.riskScore,
          }),
        })
      } else {
        push({
          title: t('toast.noRule'),
          body: t('toast.noRuleBody', { status: statusLabel(response.posting.status, t) }),
        })
      }
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setChecking(false)
    }
  }

  async function submitOverride() {
    if (!overrideReason.trim()) {
      push({ tone: 'error', title: t('error.required'), body: t('override.reason') })
      return
    }
    setOverrideSaving(true)
    try {
      await api.postings.override(id, {
        status: overrideStatus,
        reason: overrideReason.trim(),
        recruiterId: user.id,
      })
      await detail.reload()
      setOverrideOpen(false)
      setOverrideReason('')
      push({ tone: 'success', title: t('override.done') })
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setOverrideSaving(false)
    }
  }

  async function removePosting() {
    setDeleting(true)
    try {
      await api.postings.remove(id)
      push({ tone: 'success', title: t('toast.deleted') })
      navigate('/recruiter/inbox')
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
      setDeleting(false)
    }
  }

  if (detail.error) {
    return (
      <div className="page">
        <Empty
          icon="alert"
          title={t('detail.notFound')}
          hint={t('detail.notFoundHint')}
          action={
            <Link className="btn btn--secondary" to="/recruiter/inbox">
              {t('common.back')}
            </Link>
          }
        />
      </div>
    )
  }

  if (!posting) {
    return (
      <div className="page">
        <div className="card">
          <div className="card__body stack">
            <span className="sk" style={{ width: '38%', height: 24 }} />
            <span className="sk" style={{ width: '62%' }} />
            <span className="sk" style={{ width: '100%', height: 120 }} />
          </div>
        </div>
      </div>
    )
  }

  const tone = statusTone(posting.status)
  const firedEntry = trace?.fired ?? null

  const tabs = [
    { id: 'indicators', label: t('detail.tab.indicators') },
    { id: 'rules', label: t('detail.tab.rules'), count: 8 },
    { id: 'history', label: t('detail.tab.history'), count: posting.history?.length ?? 0 },
    { id: 'reports', label: t('detail.tab.reports'), count: posting.reportCount ?? 0 },
  ]

  return (
    <div className="page">
      <Link className="backlink" to="/recruiter/inbox">
        <Icon name="arrowLeft" size={13} />
        {t('nav.inbox')}
      </Link>

      {/* T5.1 — result header. T5.3 — status badge on the right. */}
      <header className="posthead">
        <div style={{ minWidth: 0 }}>
          <h1>{posting.title}</h1>
          <div className="postmeta">
            <span>
              <Icon name="building" size={13} />
              {posting.company?.name}
              {posting.company?.country ? ` · ${posting.company.country}` : ''}
            </span>
            <span>
              <Icon name="globe" size={13} />
              {posting.location}
            </span>
            <span>
              <Icon name="clock" size={13} />
              {relativeDays(posting.ageDays ?? posting.age_days, t)}
            </span>
            <span className="mono">
              #{String(posting.id).padStart(4, '0')}
            </span>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <StatusBadge status={posting.status} size="lg" />
          <button type="button" className="btn btn--primary" onClick={recheck} disabled={checking}>
            {checking ? <span className="spinner" /> : <Icon name="refresh" size={14} />}
            {checking ? t('detail.rechecking') : t('detail.recheck')}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setOverrideStatus(posting.status === 'P' ? 'F' : posting.status)
              setOverrideOpen(true)
            }}
          >
            <Icon name="scale" size={14} />
            {t('detail.adjudicate')}
          </button>
          <button
            type="button"
            className="btn btn--danger-ghost"
            onClick={() => setDeleteOpen(true)}
            aria-label={t('common.delete')}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </header>

      <div className="casegrid">
        <div>
          <div className="card">
            <Tabs tabs={tabs} value={tab} onChange={setTab} />

            {tab === 'indicators' ? (
              <div>
                <div className="card__body">
                  <div className="section-title">
                    <h2>{t('detail.description')}</h2>
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.68, color: 'var(--ink-soft)' }}>
                    {posting.description || '—'}
                  </p>
                </div>
                <div className="indicators" style={{ borderTop: '1px solid var(--line-soft)' }}>
                  {Object.keys(INDICATOR_FIELDS).map((groupKey) => (
                    <IndicatorBlock key={groupKey} groupKey={groupKey} posting={posting} t={t} />
                  ))}
                </div>
                <div className="card__foot">
                  <span className="tiny faint">{t('detail.indicatorNote')}</span>
                </div>
              </div>
            ) : null}

            {/* T5.2 — "All rules" tab: one card per rule with every condition
                resolved against this posting (pass/fail + actual value). */}
            {tab === 'rules' ? (
              <div className="card__body">
                <Notice icon="info" style={{ marginBottom: 14 }}>
                  {t('admin.rules.note')}
                </Notice>
                <div className="rulelist">
                  {trace?.trace.map((entry) => (
                    <RuleCard
                      key={entry.code}
                      entry={entry}
                      state={
                        entry.code === trace.firedCode ? 'fired' : entry.matched ? 'idle' : 'muted'
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {tab === 'history' ? (
              <div className="card__body">
                {posting.history?.length ? (
                  <div className="timeline">
                    {posting.history.map((entry) => (
                      <div
                        className={`tl tl--${entry.mode === 'manual' ? 'manual' : 'auto'}`}
                        key={entry.id}
                      >
                        <span className="tl__dot" />
                        <div>
                          <div className="tl__title">
                            {statusLabel(entry.label, t)}
                            {entry.ruleId ? ` · ${entry.ruleId}` : ` · ${t('override.title')}`}
                          </div>
                          <div className="tl__sub">
                            {entry.recruiterName}
                            {entry.reason ? ` — ${entry.reason}` : ''}
                          </div>
                        </div>
                        <span className="tl__time">{new Date(entry.decisionDate).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty icon="clock" title={t('detail.history.empty')} />
                )}
              </div>
            ) : null}

            {tab === 'reports' ? (
              <div className="card__body">
                {posting.reports?.length ? (
                  <div className="timeline">
                    {posting.reports.map((report) => (
                      <div className="tl" key={report.id}>
                        <span className="tl__dot" />
                        <div>
                          <div className="tl__title">
                            {t(`reason.${report.reason}`)}
                          </div>
                          <div className="tl__sub">
                            {t('detail.reports.by', {
                              name: report.candidate
                                ? `${report.candidate.name} ${report.candidate.surname}`
                                : '—',
                            })}
                          </div>
                        </div>
                        <span className="tl__time">
                          {new Date(report.reportDate).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty icon="flag" title={t('detail.reports.empty')} />
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* T5.3 — verdict stamp + risk ruler. */}
        <aside className="caseside">
          <div className={`verdict verdict--${tone}`}>
            <div className="verdict__label">{t('detail.verdict')}</div>
            <div className="verdict__word">{statusLabel(posting.status, t)}</div>
            <div className="verdict__rule">
              {firedEntry ? (
                <>
                  {t('detail.firedRule')} <b>{firedEntry.code}</b> · {firedEntry.name}
                </>
              ) : (
                t('detail.noRule')
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              <RiskRuler score={posting.riskScore} size="lg" showScale label={t('risk.score')} />
            </div>
          </div>

          {/* T5.2 — "Why this verdict": fired rule code, name, summary,
              condition ledger and the rule's actions. */}
          <div className="card">
            <div className="card__head">
              <span className="card__title">{t('detail.explanation')}</span>
              {firedEntry ? (
                <span className="spacer mono tiny faint">
                  {t('detail.priority')} {firedEntry.priority}
                </span>
              ) : null}
            </div>
            <div className="card__body">
              {firedEntry ? (
                <>
                  <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                    <span className="rule__code">{firedEntry.code}</span>
                    <span className="mono tiny muted" style={{ overflowWrap: 'anywhere' }}>
                      {firedEntry.name}
                    </span>
                  </div>
                  <p className="rule__summary" style={{ marginBottom: 12 }}>
                    {t(firedEntry.summary)}
                  </p>
                  <ConditionLedger conditions={firedEntry.conditions} />
                  <ActionTokens actions={firedEntry.actions} />
                </>
              ) : (
                <Notice icon="clock">{t('detail.noRuleBody')}</Notice>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <span className="card__title">{t('detail.company')}</span>
              {posting.company?.blacklisted === 1 ? (
                <span className="spacer">
                  <StatusBadge status="F" />
                </span>
              ) : null}
            </div>
            <div className="card__body stack-sm">
              <div className="strong">{posting.company?.name}</div>
              <dl className="kv">
                <dt>{t('field.company.country')}</dt>
                <dd>{posting.company?.country || '—'}</dd>
                <dt>{t('field.company.industry')}</dt>
                <dd>{posting.company?.industry || '—'}</dd>
                <dt>{t('field.company.ageYears')}</dt>
                <dd className="mono">{posting.company?.ageYears ?? posting.company?.age_years ?? '—'}</dd>
                <dt>{t('field.company.postingsLast24h')}</dt>
                <dd className="mono">{posting.company?.postingsLast24h ?? posting.company?.postings_last_24h ?? '—'}</dd>
                <dt>{t('detail.checkedAt')}</dt>
                <dd>{posting.checkedAt ? new Date(posting.checkedAt).toLocaleString() : '—'}</dd>
              </dl>
              {posting.company?.blacklisted === 1 ? (
                <Notice tone="danger" icon="shield" style={{ marginTop: 10 }}>
                  {t('detail.blacklistedCompany')}
                </Notice>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        title={t('override.title')}
        subtitle={t('override.sub')}
        footer={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setOverrideOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={submitOverride}
              disabled={overrideSaving}
            >
              {overrideSaving ? <span className="spinner" /> : null}
              {t('override.submit')}
            </button>
          </>
        }
      >
        <div className="stack">
          <div className="field">
            <span className="field__label">{t('override.status')}</span>
            <Segmented
              value={overrideStatus}
              onChange={setOverrideStatus}
              label={t('override.status')}
              options={['L', 'S', 'F'].map((value) => ({
                value,
                label: STATUS_META[value].label,
              }))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="override-reason">
              {t('override.reason')}
            </label>
            <textarea
              id="override-reason"
              className="textarea"
              value={overrideReason}
              placeholder={t('override.reasonPlaceholder')}
              onChange={(event) => setOverrideReason(event.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={removePosting}
        title={t('common.delete')}
        body={`${posting.title} — ${t('admin.companies.deleteEmpty')}`}
        confirmLabel={t('common.delete')}
        busy={deleting}
      />
    </div>
  )
}
