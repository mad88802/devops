/**
 * Recruiter inbox.
 *
 * T7.1 — Posting list and search UI ... debounced search box + DataTable
 * T7.2 — Filter by status ............. STATUS_FILTERS chips below the search
 *
 * The same list endpoint also powers the candidate Browse page
 * (src/pages/candidate/Browse.jsx).
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { describeValue } from '../shared/fields.js'
import { api } from '../src/api/client.js'
import { DataTable } from './DataTable.jsx'
import { Icon } from '../src/components/Icon.jsx'
import { RiskRuler } from '../T5.3/RiskRuler.jsx'
import { Empty, Notice } from '../src/components/Small.jsx'
import { Pagination } from './Pagination.jsx'
import { StatusBadge } from '../T5.3/StatusBadge.jsx'
import { StatusFilter } from '../T7.2/StatusFilter.jsx'
import { useAuth } from '../src/context/AuthContext.jsx'
import { useToast } from '../src/context/ToastContext.jsx'
import { useI18n } from '../src/i18n/index.jsx'
import { percent, relativeDays } from '../src/lib/format.js'
import { useAsync } from '../src/lib/useAsync.js'

export function Inbox() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [checking, setChecking] = useState(null)

  // T7.1 — debounce typing so every keystroke does not hit /api/postings.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  const summary = useAsync(() => api.stats.summary(), [])
  // T7.1 search/paging/sort + T7.2 status filter in one request.
  const list = useAsync(
    () => api.postings.list({ q: search, status, sort, page, limit: 10 }),
    [search, status, sort, page],
  )

  const rows = list.data?.items ?? []

  async function checkPosting(posting) {
    setChecking(posting.id)
    try {
      const response = await api.postings.check(posting.id, user.id)
      const result = response.result
      if (result.firedCode) {
        push({
          tone: result.firedCode.startsWith('R8') ? 'success' : 'warn',
          title: t('toast.checked', { rule: result.firedCode }),
          body: t('toast.checkedBody', {
            status: t(`status.${result.status}`),
            score: result.riskScore,
          }),
        })
      } else {
        push({
          title: t('toast.noRule'),
          body: t('toast.noRuleBody', { status: t(`status.${response.posting.status}`) }),
        })
      }
      list.reload()
      summary.reload()
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setChecking(null)
    }
  }

  const columns = [
    {
      key: 'title',
      header: t('inbox.col.posting'),
      render: (row) => (
        <div style={{ minWidth: 0 }}>
          <div className="table__title">{row.title}</div>
          <div className="table__sub">
            {row.location} · {describeValue('posting.employmentType', row.employmentType, t)}
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: t('inbox.col.company'),
      render: (row) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13 }}>{row.company?.name ?? '—'}</div>
          <div className="table__sub">{row.company?.country}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('inbox.col.status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'risk',
      header: t('inbox.col.risk'),
      render: (row) => <RiskRuler score={row.riskScore} label={t('risk.score')} />,
    },
    {
      key: 'reports',
      header: t('inbox.col.reports'),
      align: 'right',
      render: (row) =>
        row.reportCount > 0 ? (
          <span className="cell-mono">{row.reportCount}</span>
        ) : (
          <span className="faint small">—</span>
        ),
    },
    {
      key: 'posted',
      header: t('inbox.col.posted'),
      render: (row) => <span className="small muted nowrap">{relativeDays(row.ageDays, t)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={checking === row.id}
          onClick={(event) => {
            event.stopPropagation()
            checkPosting(row)
          }}
        >
          {checking === row.id ? <span className="spinner" /> : <Icon name="refresh" size={12} />}
          {t('inbox.check')}
        </button>
      ),
    },
  ]

  const stats = summary.data

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t('inbox.title')}</h1>
          <p>{t('inbox.sub')}</p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--primary" to="/recruiter/postings/new">
            <Icon name="plus" size={14} />
            {t('nav.newPosting')}
          </Link>
        </div>
      </div>

      {stats ? (
        <div className="stats">
          <div className="stat">
            <div className="stat__label">{t('dash.kpi.postings')}</div>
            <div className="stat__value">{stats.total}</div>
            <div className="stat__foot">
              {t('dash.kpi.postingsFoot', { count: stats.companies })}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">{t('dash.kpi.fakeShare')}</div>
            <div className="stat__value">{percent(stats.fakeShare)}</div>
            <div className="stat__foot">
              {t('dash.kpi.fakeShareFoot', { count: stats.byStatus.F })}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">{t('dash.kpi.pending')}</div>
            <div className="stat__value">{stats.pending}</div>
            <div className="stat__foot">
              {t('dash.kpi.pendingFoot', { count: stats.byStatus.S })}
            </div>
          </div>
          <div className="stat">
            <div className="stat__label">{t('dash.kpi.reports')}</div>
            <div className="stat__value">{stats.reports7d}</div>
            <div className="stat__foot">
              {t('dash.kpi.reportsFoot', { count: stats.checkedTotal })}
            </div>
          </div>
        </div>
      ) : null}

      {stats && stats.pending > 0 && status !== 'P' ? (
        <Notice style={{ marginTop: 14 }} icon="clock">
          <span>{t('inbox.pendingBanner', { count: stats.pending })}</span>{' '}
          <button type="button" className="linkbtn" onClick={() => setStatus('P')}>
            {t('inbox.showQueue')}
          </button>
        </Notice>
      ) : null}

      {/* T7.1 — list card: search, T7.2 status chips, sort, table, paging. */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={14} />
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('inbox.searchPlaceholder')}
              aria-label={t('common.search')}
            />
          </label>

          {/* T7.2 — status filter chips, with a count per verdict. */}
          <StatusFilter
            value={status}
            counts={stats?.byStatus}
            total={stats?.total}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          />

          <span className="spacer" />

          <select
            className="mini-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label={t('inbox.filter.sort')}
          >
            <option value="recent">{t('inbox.sort.recent')}</option>
            <option value="risk">{t('inbox.sort.risk')}</option>
            <option value="reported">{t('inbox.sort.reported')}</option>
            <option value="title">{t('inbox.sort.title')}</option>
          </select>
        </div>

        {list.error ? (
          <Notice tone="danger" style={{ margin: 18 }}>
            {t(list.error.key ?? 'error.server')}{' '}
            <button type="button" className="linkbtn" onClick={list.reload}>
              {t('common.retry')}
            </button>
          </Notice>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            loading={list.status === 'loading'}
            onRowClick={(row) => navigate(`/recruiter/postings/${row.id}`)}
            empty={
              <Empty
                icon="inbox"
                title={t('inbox.empty.title')}
                hint={t('inbox.empty.hint')}
                action={
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      setQuery('')
                      setStatus('')
                      setSort('recent')
                    }}
                  >
                    {t('common.refresh')}
                  </button>
                }
              />
            }
          />
        )}

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
    </div>
  )
}
