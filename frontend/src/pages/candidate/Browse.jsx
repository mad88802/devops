/**
 * Candidate browse page.
 *
 * T7.1 — Posting list and search UI ... debounced search + job cards
 * T7.2 — Status filter (shared) ...... STATUS_FILTERS chips
 * T7.3 — Report button ............... per-card report button + ReportDialog
 * T5.3 — Status badges and risk ...... StatusBadge + RiskRuler per card
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { Icon } from '../../components/Icon.jsx'
import { ReportDialog } from '../../components/ReportDialog.jsx'
import { RiskRuler } from '../../components/RiskRuler.jsx'
import { Empty, Notice } from '../../components/Small.jsx'
import { Pagination } from '../../components/Pagination.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { StatusFilter } from '../../components/StatusFilter.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { formatSalary, relativeDays } from '../../lib/format.js'
import { useAsync } from '../../lib/useAsync.js'

export function Browse() {
  const { t } = useI18n()

  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [reporting, setReporting] = useState(null)
  const [reported, setReported] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  const list = useAsync(
    () => api.postings.list({ q: search, status, page, limit: 8, sort: 'recent' }),
    [search, status, page],
  )

  const rows = list.data?.items ?? []

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t('browse.title')}</h1>
          <p>{t('browse.sub')}</p>
        </div>
      </div>

      <Notice tone="info" icon="shield">
        {t('browse.disclaimer')}
      </Notice>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={14} />
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('browse.search')}
              aria-label={t('common.search')}
            />
          </label>

          <StatusFilter
            value={status}
            order={['', 'F', 'S', 'L', 'P']}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          />
        </div>

        <div className="card__body">
          <p className="hint" style={{ marginBottom: 14, maxWidth: '70ch' }}>
            {t('browse.intro')}
          </p>

          {list.error ? (
            <Notice tone="danger" icon="alert">
              {t(list.error.key ?? 'error.server')}{' '}
              <button type="button" className="linkbtn" onClick={list.reload}>
                {t('common.retry')}
              </button>
            </Notice>
          ) : null}

          {list.status === 'loading' && rows.length === 0 ? (
            <div className="joblist">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="jobcard" key={index}>
                  <div>
                    <span className="sk" style={{ width: '45%', height: 18 }} />
                    <span className="sk" style={{ width: '65%', marginTop: 10, display: 'block' }} />
                  </div>
                  <div />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty icon="search" title={t('browse.empty.title')} hint={t('browse.empty.hint')} />
          ) : (
            <div className="joblist">
              {rows.map((posting) => (
                <article className="jobcard" key={posting.id}>
                  <div style={{ minWidth: 0 }}>
                    <Link className="jobcard__title" to={`/candidate/postings/${posting.id}`}>
                      {posting.title}
                    </Link>
                    <div className="jobcard__meta">
                      <span>
                        <Icon name="building" size={12} />
                        {posting.company?.name} · {posting.company?.country}
                      </span>
                      <span>
                        <Icon name="globe" size={12} />
                        {posting.location}
                      </span>
                      <span>
                        <Icon name="clock" size={12} />
                        {relativeDays(posting.ageDays, t)}
                      </span>
                    </div>
                    <p className="jobcard__desc">{posting.description}</p>
                  </div>

                  <div className="jobcard__side">
                    <StatusBadge status={posting.status} size="lg" />
                    <div className="jobcard__risk">
                      <span>{t('common.risk')}</span>
                      <RiskRuler score={posting.riskScore} />
                    </div>
                    <span className="small muted mono">
                      {formatSalary(posting.salary, t)}
                    </span>
                    {/* T7.3 — report this posting. */}
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={reported.includes(posting.id)}
                      onClick={() => setReporting(posting)}
                    >
                      <Icon name="flag" size={12} />
                      {reported.includes(posting.id) ? t('browse.reported') : t('browse.report')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {list.data && list.data.total > 0 ? (
          <Pagination
            page={list.data.page}
            pages={list.data.pages}
            total={list.data.total}
            limit={list.data.limit}
            onChange={setPage}
          />
        ) : null}
      </div>

      {/* T7.3 — report dialog (R9 / R10). */}
      <ReportDialog
        open={Boolean(reporting)}
        posting={reporting}
        onClose={() => setReporting(null)}
        onReported={(response) => {
          setReported((current) => [...current, reporting.id])
          list.reload()
          if (response.posting) {
            // keep the card in sync with the escalated status
          }
        }}
      />
    </div>
  )
}
