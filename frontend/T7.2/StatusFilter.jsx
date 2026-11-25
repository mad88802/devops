/**
 * T7.2 — Status filter chips.
 *
 * Controlled component: the parent owns the selected status and resets the
 * page. Counts are optional so the candidate browse page can reuse it without
 * the recruiter KPI summary.
 */
import { useI18n } from '../src/i18n/index.jsx'
import { STATUS_ORDER } from '../T5.3/statusMeta.js'

const DEFAULT_ORDER = ['', ...STATUS_ORDER]

export function StatusFilter({ value, onChange, counts, total, order = DEFAULT_ORDER }) {
  const { t } = useI18n()

  return (
    <div className="chips">
      {order.map((code) => (
        <button
          key={code || 'all'}
          type="button"
          className="chip"
          aria-pressed={value === code}
          onClick={() => onChange(code)}
        >
          {code ? t(`status.${code}`) : t('common.all')}
          {counts && code ? <span className="chip__count">{counts[code]}</span> : null}
          {counts && !code ? <span className="chip__count">{total ?? 0}</span> : null}
        </button>
      ))}
    </div>
  )
}
