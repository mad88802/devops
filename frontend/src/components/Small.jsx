/**
 * Small shared UI pieces.
 *
 * T5.1 — Tabs / Empty / Notice used by the result page.
 * T7.1 — Pagination used by the posting list.
 */
import { useI18n } from '../i18n/index.jsx'
import { Icon } from './Icon.jsx'

// T7.1 — pagination lives in its task folder; re-export for existing imports.
export { Pagination } from '../../T7.1/Pagination.jsx'

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className="tab"
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined ? <span className="tab__count">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon = 'file', title, hint, action }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="empty__title">{title}</div>
      {hint ? <p className="empty__hint">{hint}</p> : null}
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  )
}

export function Notice({ tone = 'default', icon = 'info', children, style }) {
  return (
    <div className={`notice${tone !== 'default' ? ` notice--${tone}` : ''}`} style={style}>
      <Icon name={icon} size={15} />
      <div>{children}</div>
    </div>
  )
}

export function Spinner({ label }) {
  return (
    <span className="row" style={{ gap: 8 }}>
      <span className="spinner" />
      {label ? <span className="small muted">{label}</span> : null}
    </span>
  )
}
