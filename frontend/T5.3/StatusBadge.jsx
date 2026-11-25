/**
 * T5.3 — Status badge.
 *
 * A colour, a square and the word, used on the result page, the inbox list,
 * the dashboard and the candidate view.
 */
import { useI18n } from '../src/i18n/index.jsx'
import { STATUS_META } from './statusMeta.js'

export function StatusBadge({ status, size }) {
  const { t } = useI18n()
  const meta = STATUS_META[status] ?? STATUS_META.P
  return (
    <span className={`status status--${meta.tone}${size === 'lg' ? ' status--lg' : ''}`}>
      {t(meta.label)}
    </span>
  )
}

export function StatusDot({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.P
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: 1,
        background: `var(--${meta.tone === 'pending' ? 'pending' : meta.tone})`,
        flex: 'none',
      }}
    />
  )
}
