/**
 * T10.2 — Weekly fake-share bar chart.
 *
 * Accessible bars (hover/focus readout) with a table view fallback. The data is
 * the `items` array from `GET /api/stats/weekly`.
 */
import { useState } from 'react'
import { Empty } from './Small.jsx'

export function WeeklyChart({ weeks, t, locale }) {
  const [active, setActive] = useState(null)
  const [asTable, setAsTable] = useState(false)

  // Build the label from local date parts: parsing 'YYYY-MM-DD' as UTC can
  // shift the displayed day in negative-offset timezones.
  const short = (iso) => {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
    })
  }

  if (!weeks.length) {
    return <Empty icon="activity" title={t('dash.noData')} />
  }

  const shares = weeks.map((week) => week.fakeShare)
  const maxIndex = shares.indexOf(Math.max(...shares))
  const lastIndex = weeks.length - 1
  const currentWeek = weeks[active ?? lastIndex]

  return (
    <>
      <div className="chart__head">
        <div className="chart__readout">
          <span className="tiny faint">
            {t('dash.week')} {short(currentWeek.weekStart)}
          </span>
          <span className="mono" style={{ fontSize: 21, letterSpacing: '-0.03em' }}>
            {currentWeek.fakeShare}%
          </span>
          <span className="small muted">
            {t('dash.readout', { fake: currentWeek.fake, total: currentWeek.total })}
          </span>
        </div>
        <span className="spacer" />
        <button type="button" className="linkbtn" onClick={() => setAsTable((value) => !value)}>
          {asTable ? t('dash.chartView') : t('dash.tableView')}
        </button>
      </div>

      {asTable ? (
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('dash.week')}</th>
                <th className="cell-right">{t('dash.kpi.postings')}</th>
                <th className="cell-right">{t('dash.legend.fake')}</th>
                <th className="cell-right">{t('dash.share')}</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekStart}>
                  <td className="mono small">{short(week.weekStart)}</td>
                  <td className="cell-right cell-mono">{week.total}</td>
                  <td className="cell-right cell-mono">{week.fake}</td>
                  <td className="cell-right cell-mono">{week.fakeShare}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart__plot">
          <div className="chart__y" aria-hidden="true">
            <span>100%</span>
            <span>50%</span>
            <span>0</span>
          </div>

          <div className="chart__axis">
            {weeks.map((week, index) => {
              const labelled = index === maxIndex || index === lastIndex
              return (
                <button
                  type="button"
                  key={week.weekStart}
                  className={`col${active === index ? ' is-active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  aria-label={`${t('dash.week')} ${short(week.weekStart)}: ${week.fakeShare}%, ${t('dash.readout', { fake: week.fake, total: week.total })}`}
                >
                  <span className="col__area">
                    <span
                      className="col__stack"
                      style={{ height: `${Math.max(week.fakeShare, week.total ? 1.5 : 0)}%` }}
                    >
                      {labelled ? <span className="col__value">{week.fakeShare}%</span> : null}
                    </span>
                  </span>
                  <span className="col__label">{short(week.weekStart)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
