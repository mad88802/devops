/**
 * T10.2 — Chart UI.
 *
 * Weekly fake-share chart, per-company fake-share bars and the "rules that
 * fired" bar table. The page accepts optional `weeks` / `companyId` props so
 * the T10.3 filter wrapper can scope every statistics query.
 *
 * `src/pages/recruiter/Dashboard.jsx` is a shim; in the final tree it points
 * at the T10.3 wrapper, which renders this component with the filter props.
 */
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { Icon } from '../../components/Icon.jsx'
import { Empty, Notice } from '../../components/Small.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { percent } from '../../lib/format.js'
import { useAsync } from '../../lib/useAsync.js'
import { WeeklyChart } from '../../components/WeeklyChart.jsx'

export function Dashboard({ weeks = 9, companyId = '', companyName = null, headerActions = null }) {
  const { t, locale, formatDate } = useI18n()
  const filters = companyId ? { weeks, companyId } : { weeks }

  // T10.1 data fetch for T10.2, scoped by the T10.3 filters.
  const dash = useAsync(
    () =>
      Promise.all([
        api.stats.summary(filters),
        api.stats.weekly(weeks, { companyId }),
        api.stats.companies({ weeks, companyId }),
        api.stats.rules(filters),
        api.stats.activity(7, filters),
      ]).then(([summary, weekly, companies, rules, activity]) => ({
        summary,
        weeks: weekly.items,
        companies: companies.items,
        rules: rules.items,
        activity: activity.items,
      })),
    [weeks, companyId],
  )

  const data = dash.data
  const maxRuleCount = data ? Math.max(1, ...data.rules.map((row) => row.count)) : 1

  return (
    <div className="page page--dashboard">
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t('dash.title')}</h1>
          <p>{t('dash.sub')}</p>
        </div>
        <div className="page-head__actions">
          {/* T10.3 injects its filter controls here. */}
          {headerActions}

          <button type="button" className="btn btn--secondary" onClick={dash.reload}>
            <Icon name="refresh" size={14} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {dash.error ? (
        <Notice tone="danger" icon="alert">
          {t(dash.error.key ?? 'error.server')}{' '}
          <button type="button" className="linkbtn" onClick={dash.reload}>
            {t('common.retry')}
          </button>
        </Notice>
      ) : null}

      {data ? (
        <>
          <div className="stats">
            <div className="stat">
              <div className="stat__label">{t('dash.kpi.postings')}</div>
              <div className="stat__value">{data.summary.total}</div>
              <div className="stat__foot">
                {t('dash.kpi.postingsFoot', { count: data.summary.companies })}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">{t('dash.kpi.fakeShare')}</div>
              <div className="stat__value">{percent(data.summary.fakeShare)}</div>
              <div className="stat__foot">
                {t('dash.kpi.fakeShareFoot', { count: data.summary.byStatus.F })}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">{t('dash.kpi.pending')}</div>
              <div className="stat__value">{data.summary.pending}</div>
              <div className="stat__foot">
                {t('dash.kpi.pendingFoot', { count: data.summary.byStatus.S })}
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">{t('dash.kpi.reports')}</div>
              <div className="stat__value">{data.summary.reports7d}</div>
              <div className="stat__foot">
                {t('dash.kpi.reportsFoot', { count: data.summary.checkedTotal })}
              </div>
            </div>
          </div>

          <div className="dashgrid" style={{ marginTop: 16 }}>
            <div className="stack">
              {/* T10.2 — weekly chart card. T10.3 — responds to the period
                  (and company) selectors in the page header. */}
              <section className="card">
                <div className="card__head">
                  <span className="card__title">{t('dash.weekly.title')}</span>
                  <span className="card__sub">
                    {t('dash.weekly.sub', { count: data.weeks.length })}
                  </span>
                </div>
                <div className="chart">
                  <WeeklyChart weeks={data.weeks} t={t} locale={locale} />
                </div>
              </section>

              <section className="card">
                <div className="card__head">
                  <span className="card__title">{t('dash.rules.title')}</span>
                  <span className="card__sub">{t('dash.rules.sub')}</span>
                </div>
                <div className="card__body card__body--flush">
                  <div className="tablewrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t('dash.rules.rule')}</th>
                          <th className="cell-right" style={{ width: 90 }}>
                            {t('dash.rules.count')}
                          </th>
                          <th aria-hidden="true" style={{ width: '38%' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {data.rules.map((row) => (
                          <tr key={row.ruleId}>
                            <td>
                              <span className="row" style={{ gap: 8 }}>
                                <span className="rule__code">{row.ruleId}</span>
                                <span className="small mono faint">{row.ruleId}</span>
                              </span>
                            </td>
                            <td className="cell-right cell-mono">{row.count}</td>
                            <td aria-hidden="true">
                              <span
                                className="hbar__track"
                                style={{ display: 'block', width: '100%' }}
                              >
                                <span
                                  className="hbar__fill"
                                  style={{ width: `${(row.count / maxRuleCount) * 100}%` }}
                                />
                              </span>
                            </td>
                          </tr>
                        ))}
                        {data.rules.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="muted small">
                              {t('dash.activity.empty')}
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>

            <div className="stack">
              {/* T10.2 — per-company fake-share bars. T10.3 — the company
                  selector in the page header narrows this to one company. */}
              <section className="card">
                <div className="card__head">
                  <span className="card__title">
                    {companyName
                      ? t('dash.company.selected', { company: companyName })
                      : t('dash.company.title')}
                  </span>
                  <span className="card__sub">{t('dash.company.sub')}</span>
                </div>
                <div className="hbars">
                  {data.companies.map((company) => (
                    <div className="hbar" key={company.companyId}>
                      <span className="hbar__name" title={company.name}>
                        {company.name}
                        {company.blacklisted === 1 ? (
                          <span className="roletag" style={{ marginLeft: 6 }}>
                            {t('admin.companies.blacklist')}
                          </span>
                        ) : null}
                      </span>
                      <span className="hbar__pct">{company.fakeShare}%</span>
                      <div className="hbar__track">
                        <div className="hbar__fill" style={{ width: `${company.fakeShare}%` }} />
                      </div>
                      <div className="hbar__meta">
                        <span>{t('dash.company.meta', { fake: company.fake, total: company.total })}</span>
                        <span>·</span>
                        <span>
                          {company.suspicious} {t('dash.legend.suspicious').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="card__head">
                  <span className="card__title">{t('dash.activity.title')}</span>
                  <span className="card__sub">
                    {companyId || weeks !== 9
                      ? t('dash.activity.subFiltered')
                      : t('dash.activity.sub')}
                  </span>
                </div>
                <div className="card__body">
                  {data.activity.length === 0 ? (
                    <Empty icon="clock" title={t('dash.activity.empty')} />
                  ) : (
                    <div className="activity">
                      {data.activity.map((entry) => (
                        <Link
                          className="act"
                          key={entry.id}
                          to={`/recruiter/postings/${entry.postingId}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <span
                            className="act__dot"
                            style={{
                              background:
                                entry.label === 'F'
                                  ? 'var(--fake)'
                                  : entry.label === 'S'
                                    ? 'var(--suspicious)'
                                    : entry.label === 'L'
                                      ? 'var(--legit)'
                                      : 'var(--pending)',
                            }}
                          />
                          <span style={{ minWidth: 0 }}>
                            <span className="act__title">{entry.title}</span>
                            <span className="act__sub">
                              {entry.company} · {entry.ruleId ?? t('override.title')}
                            </span>
                          </span>
                          <span className="act__time">
                            {formatDate(entry.at)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card__body stack">
            <span className="sk" style={{ width: '30%' }} />
            <span className="sk" style={{ width: '100%', height: 120 }} />
            <span className="sk" style={{ width: '80%' }} />
          </div>
        </div>
      )}
    </div>
  )
}
