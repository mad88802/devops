/**
 * Candidate posting view — the public variant of the T5.1 result page.
 *
 * T5.1 — Result page UI (candidate view)
 * T5.3 — Status badge and risk score display
 * T7.3 — Report button
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { describeValue } from '../../lib/fields.js'
import { api } from '../../api/client.js'
import { Icon } from '../../components/Icon.jsx'
import { ReportDialog } from '../../components/ReportDialog.jsx'
import { RiskRuler } from '../../components/RiskRuler.jsx'
import { Empty, Notice } from '../../components/Small.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { formatSalary, relativeDays, statusTone } from '../../lib/format.js'
import { useAsync } from '../../lib/useAsync.js'

export function PostingView() {
  const { id } = useParams()
  const { t } = useI18n()
  const [reportOpen, setReportOpen] = useState(false)
  const [reported, setReported] = useState(false)

  const detail = useAsync(() => api.postings.get(id), [id])
  const posting = detail.data?.posting

  if (detail.error) {
    return (
      <div className="page">
        <Empty
          icon="alert"
          title={t('detail.notFound')}
          hint={t('detail.notFoundHint')}
          action={
            <Link className="btn btn--secondary" to="/candidate/browse">
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
            <span className="sk" style={{ width: '40%', height: 24 }} />
            <span className="sk" style={{ width: '70%' }} />
            <span className="sk" style={{ width: '100%', height: 140 }} />
          </div>
        </div>
      </div>
    )
  }

  const tone = statusTone(posting.status)

  return (
    <div className="page">
      <Link className="backlink" to="/candidate/browse">
        <Icon name="arrowLeft" size={13} />
        {t('browse.title')}
      </Link>

      <header className="posthead">
        <div style={{ minWidth: 0 }}>
          <h1>{posting.title}</h1>
          <div className="postmeta">
            <span>
              <Icon name="building" size={13} />
              {posting.company?.name} · {posting.company?.country}
            </span>
            <span>
              <Icon name="globe" size={13} />
              {posting.location}
            </span>
            <span>
              <Icon name="clock" size={13} />
              {relativeDays(posting.ageDays, t)}
            </span>
          </div>
        </div>
        <StatusBadge status={posting.status} size="lg" />
      </header>

      <div className="casegrid">
        <div className="stack">
          <section className="card">
            <div className="card__head">
              <span className="card__title">{t('view.about')}</span>
            </div>
            <div className="card__body">
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
                {posting.description || '—'}
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <span className="card__title">{t('common.company')}</span>
            </div>
            <div className="card__body">
              <dl className="kv">
                <dt>{t('common.name')}</dt>
                <dd>{posting.company?.name}</dd>
                <dt>{t('field.company.country')}</dt>
                <dd>{posting.company?.country || '—'}</dd>
                <dt>{t('field.company.industry')}</dt>
                <dd>{posting.company?.industry || '—'}</dd>
                <dt>{t('field.company.ageYears')}</dt>
                <dd className="mono">{posting.company?.ageYears}</dd>
                <dt>{t('view.salary')}</dt>
                <dd className="mono">{formatSalary(posting.salary, t)}</dd>
                <dt>{t('view.type')}</dt>
                <dd>{describeValue('posting.employmentType', posting.employmentType, t)}</dd>
                <dt>{t('common.reports')}</dt>
                <dd className="mono">{posting.reportCount ?? 0}</dd>
              </dl>
            </div>
          </section>
        </div>

        <aside className="caseside">
          <div className={`verdict verdict--${tone}`}>
            <div className="verdict__label">{t('detail.verdict')}</div>
            <div className="verdict__word" style={{ fontSize: 'var(--text-2xl)' }}>
              {t(`status.${posting.status}`)}
            </div>
            <div className="verdict__rule" style={{ borderTop: 'none', paddingTop: 4 }}>
              {t(`status.${posting.status}.hint`)}
            </div>
            <div style={{ marginTop: 14 }}>
              <RiskRuler score={posting.riskScore} size="lg" showScale label={t('risk.score')} />
            </div>
          </div>

          <div className="card">
            <div className="card__body stack-sm">
              {/* T7.3 — primary report action. */}
              <button
                type="button"
                className="btn btn--danger btn--lg btn--block"
                disabled={reported}
                onClick={() => setReportOpen(true)}
              >
                <Icon name="flag" size={15} />
                {reported ? t('browse.reported') : t('browse.report')}
              </button>
              <p className="hint">{t('report.sub')}</p>
            </div>
          </div>

          <Notice tone="warn" icon="shield">
            {t('browse.disclaimer')}
          </Notice>
        </aside>
      </div>

      <ReportDialog
        open={reportOpen}
        posting={posting}
        onClose={() => setReportOpen(false)}
        onReported={() => {
          setReported(true)
          detail.reload()
        }}
      />
    </div>
  )
}
