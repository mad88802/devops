/**
 * T5.2 — Explanation of a fired rule:
 *   ConditionLedger  every test, the expected value, the actual value, pass/fail
 *   ActionTokens     the "acting" half of the ECA rule
 */
/**
 * T5.2 — Fired-rule explanation.
 *   ConditionLedger  every test, the expected value, the actual value, pass/fail
 *   ActionTokens     the "acting" half of the ECA rule
 * The implementation lives in T5.2; `src/components/Ledger.jsx` is a shim.
 */
import { OPERATORS } from './rules.js'
import { useI18n } from '../src/i18n/index.jsx'
import { conditionValue, fieldLabel } from '../src/lib/format.js'
import { Icon } from '../src/components/Icon.jsx'

/**
 * The condition ledger: every test a rule performs, with the posting's actual
 * coded value in its own right-aligned column. This is the component that makes
 * the verdict explainable.
 */
export function ConditionLedger({ conditions, dense }) {
  const { t } = useI18n()

  return (
    <div className="ledger" style={dense ? { fontSize: 12 } : undefined}>
      {conditions.map((condition) => (
        <div
          key={`${condition.field}:${condition.op}`}
          className={`ledger__row${condition.pass ? '' : ' is-fail'}`}
        >
          <span className="ledger__label">{fieldLabel(condition.field, t)}</span>
          <span className="ledger__expr">
            {OPERATORS[condition.op] ?? condition.op} {conditionValue(condition.field, condition.value, t)}
          </span>
          <span className="ledger__actual">
            {condition.actual === undefined ? '—' : conditionValue(condition.field, condition.actual, t)}
          </span>
          <span
            className={`ledger__mark ${condition.pass ? 'is-pass' : 'is-fail'}`}
            title={condition.pass ? t('detail.matched') : t('detail.notMatched')}
          >
            <Icon name={condition.pass ? 'check' : 'x'} size={11} strokeWidth={2.4} />
          </span>
        </div>
      ))}
    </div>
  )
}

/** The "acting" half of an ECA rule, as tokens. */
export function ActionTokens({ actions }) {
  const { t } = useI18n()
  if (!actions?.length) return null

  return (
    <div className="rule__actions">
      {actions.map((action, index) => {
        let label = null
        if (action.type === 'status') {
          label = t('detail.action.status', { value: action.value })
        } else if (action.type === 'risk') {
          label = t('detail.action.risk', { value: action.value })
        } else if (action.type === 'riskAdd') {
          label = t('detail.action.riskAdd', { value: action.value })
        } else if (action.type === 'recheck') {
          label = t('detail.action.recheck')
        } else if (action.type === 'blacklist') {
          label = t('detail.action.blacklist')
        }
        if (!label) return null
        return (
          <span className="action-token" key={`${action.type}-${index}`}>
            {label}
          </span>
        )
      })}
    </div>
  )
}
