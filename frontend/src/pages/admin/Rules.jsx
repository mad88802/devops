import { useEffect, useState } from 'react'
import { STATUS_META } from '../../../shared/fields.js'
import { OPERATORS } from '../../../shared/rules.js'
import { api } from '../../api/client.js'
import { Icon } from '../../components/Icon.jsx'
import { ActionTokens } from '../../components/Ledger.jsx'
import { Empty, Notice } from '../../components/Small.jsx'
import { StatusBadge } from '../../components/Status.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { fieldLabel } from '../../lib/format.js'
import { useAsync } from '../../lib/useAsync.js'

export function Rules() {
  const { t } = useI18n()
  const [selected, setSelected] = useState(null)

  const list = useAsync(() => api.rules(), [])
  const rules = list.data?.items ?? []

  useEffect(() => {
    if (!selected && rules.length > 0) setSelected(rules[0].ruleId)
  }, [rules, selected])

  const rule = rules.find((entry) => entry.ruleId === selected) ?? null

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t('admin.rules.title')}</h1>
          <p>{t('admin.rules.sub')}</p>
        </div>
        <div className="page-head__actions">
          <span className="roletag">
            {list.data?.source ?? 'ecaRule'} · {rules.length} {t('misc.rules')}
          </span>
        </div>
      </div>

      {list.error ? (
        <Notice tone="danger" icon="alert">
          {t(list.error.key ?? 'error.server')}{' '}
          <button type="button" className="linkbtn" onClick={list.reload}>
            {t('common.retry')}
          </button>
        </Notice>
      ) : null}

      <div className="casegrid">
        <div className="card">
          <div className="card__head">
            <span className="card__title">{t('admin.rules.count', { count: rules.length })}</span>
            <span className="card__sub">{t('admin.rules.conditions')}</span>
          </div>
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 54 }}>#</th>
                  <th>{t('dash.rules.rule')}</th>
                  <th className="cell-right">{t('admin.rules.priority')}</th>
                  <th>{t('admin.rules.group')}</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((entry) => (
                  <tr
                    key={entry.ruleId}
                    data-clickable="true"
                    tabIndex={0}
                    onClick={() => setSelected(entry.ruleId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') setSelected(entry.ruleId)
                    }}
                    style={
                      entry.ruleId === selected
                        ? { background: 'var(--cobalt-tint)' }
                        : undefined
                    }
                  >
                    <td>
                      <span className="rule__code">{entry.ruleId}</span>
                    </td>
                    <td>
                      <div className="mono small" style={{ overflowWrap: 'anywhere' }}>
                        {entry.name}
                      </div>
                      <div className="table__sub">{entry.participant}</div>
                    </td>
                    <td className="cell-right cell-mono">{entry.priority}</td>
                    <td>
                      <StatusBadge status={entry.group} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rules.length === 0 && list.status !== 'loading' ? (
              <Empty icon="book" title={t('admin.rules.title')} />
            ) : null}
          </div>
        </div>

        <aside className="caseside">
          {rule ? (
            <>
              <div className="card">
                <div className="card__head">
                  <span className="rule__code">{rule.ruleId}</span>
                  <span className="card__title" style={{ overflowWrap: 'anywhere' }}>
                    {rule.name}
                  </span>
                </div>
                <div className="rulemeta">
                  <div className="rulemeta__item">
                    <div className="rulemeta__label">{t('admin.rules.priority')}</div>
                    <div className="rulemeta__value">{rule.priority}</div>
                  </div>
                  <div className="rulemeta__item">
                    <div className="rulemeta__label">{t('admin.rules.group')}</div>
                    <div className="rulemeta__value">
                      <StatusBadge status={rule.group} />
                    </div>
                  </div>
                  <div className="rulemeta__item">
                    <div className="rulemeta__label">{t('admin.rules.participant')}</div>
                    <div className="rulemeta__value">{rule.participant}</div>
                  </div>
                  <div className="rulemeta__item">
                    <div className="rulemeta__label">{t('admin.rules.enabled')}</div>
                    <div className="rulemeta__value">{rule.enabled}</div>
                  </div>
                </div>

                <div className="card__body">
                  <p className="rule__summary">{t(`rule.${rule.ruleId}.summary`)}</p>

                  <div className="rulemeta__label" style={{ marginBottom: 4 }}>
                    {t('admin.rules.trigger')}
                  </div>
                  <div className="action-token" style={{ marginBottom: 14 }}>
                    {rule.trigger}
                  </div>

                  <div className="rulemeta__label" style={{ marginBottom: 4 }}>
                    {t('admin.rules.conditions')}
                  </div>
                  <div className="ledger">
                    {rule.conditions.map((condition, index) => (
                      <div
                        className="ledger__row"
                        key={`${condition.field}-${index}`}
                        style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}
                      >
                        <span className="ledger__label">{fieldLabel(condition.field, t)}</span>
                        <span className="ledger__expr">
                          {OPERATORS[condition.op] ?? condition.op}{' '}
                          {condition.field === 'posting.status'
                            ? STATUS_META[condition.value]?.code ?? condition.value
                            : String(condition.value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <ActionTokens actions={rule.actions} />
                </div>

                <div className="card__foot">
                  <span className="tiny faint">
                    {t('admin.rules.sub')}
                  </span>
                  <span className="spacer" />
                  <Icon name="book" size={13} />
                </div>
              </div>

              <Notice icon="info">{t('admin.rules.note')}</Notice>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
