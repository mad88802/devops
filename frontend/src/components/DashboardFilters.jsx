/**
 * T10.3 — Weekly and per-company filter controls.
 *
 * Presentational component: the page wrapper owns the filter state and passes
 * the current values down. The selected period and company are sent to every
 * `/api/stats/*` call by `T10.2/Dashboard.jsx`.
 */
import { useI18n } from '../i18n/index.jsx'
import { DEFAULT_WEEKS, PERIOD_OPTIONS } from '../lib/filterParams.js'

export function DashboardFilters({
  companyId,
  weeks,
  companies,
  onCompanyChange,
  onWeeksChange,
  onClear,
}) {
  const { t } = useI18n()

  return (
    <>
      <label className="filterctl">
        <span>{t('dash.filter.company')}</span>
        <select
          className="mini-select"
          value={companyId}
          onChange={(event) => onCompanyChange(event.target.value)}
        >
          <option value="">{t('dash.filter.allCompanies')}</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filterctl">
        <span>{t('dash.filter.period')}</span>
        <select
          className="mini-select"
          value={weeks}
          onChange={(event) => onWeeksChange(Number(event.target.value))}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t('dash.filter.lastWeeks', { count: option })}
            </option>
          ))}
        </select>
      </label>

      {companyId || weeks !== DEFAULT_WEEKS ? (
        <button type="button" className="linkbtn" onClick={onClear}>
          {t('dash.filter.clear')}
        </button>
      ) : null}
    </>
  )
}
