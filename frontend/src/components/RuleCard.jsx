/**
 * T5.2 — One rule card with its conditions resolved against the posting.
 * Rendered in the result page's "All rules" tab and the admin rule repository.
 */
/**
 * T5.2 — One rule card with its conditions resolved against the posting.
 * The implementation lives in T5.2; `src/components/RuleCard.jsx` is a shim.
 */
import { useI18n } from '../i18n/index.jsx'
import { ConditionLedger, ActionTokens } from './ConditionLedger.jsx'

/**
 * One rule, with its conditions resolved against the posting under review.
 * `state`: 'fired' | 'muted' (evaluated, did not match) | 'idle' (reference copy).
 */
export function RuleCard({ entry, state = 'idle', showSummary = true }) {
  const { t } = useI18n()
  const passed = entry.conditions.filter((condition) => condition.pass).length

  return (
    <article className={`rule${state === 'fired' ? ' rule--fired' : ''}${state === 'muted' ? ' rule--muted' : ''}`}>
      <header className="rule__head">
        <span className="rule__code">{entry.code}</span>
        <span className="rule__name" title={entry.name}>
          {entry.name}
        </span>
        <span className="rule__pips" aria-hidden="true">
          {entry.conditions.map((condition, index) => (
            <span
              key={index}
              className={`rule__pip${condition.pass ? ' is-on' : ''}`}
            />
          ))}
        </span>
        {state === 'fired' ? (
          <span className="status status--lg" style={{ background: 'rgba(255,255,255,.94)', borderColor: 'transparent' }}>
            {t('detail.matched')}
          </span>
        ) : (
          <span className="tiny faint nowrap">
            {passed}/{entry.conditions.length}
          </span>
        )}
      </header>
      <div className="rule__body">
        {showSummary ? <p className="rule__summary">{t(entry.summary)}</p> : null}
        <ConditionLedger conditions={entry.conditions} />
        <ActionTokens actions={entry.actions} />
      </div>
    </article>
  )
}

/** Compact one-line rule reference, used in the dashboard and lists. */
export function RuleReference({ code, name }) {
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className="rule__code">{code}</span>
      <span className="mono tiny muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
    </span>
  )
}
