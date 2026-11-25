/**
 * T7.1 — Pagination for the posting list.
 * `src/components/Small.jsx` re-exports it for existing imports.
 */
import { useI18n } from '../src/i18n/index.jsx'
import { Icon } from '../src/components/Icon.jsx'

export function Pagination({ page, pages, total, limit, onChange }) {
  const { t } = useI18n()
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)

  return (
    <div className="pagination">
      <span>{t('common.showing', { from, to, total })}</span>
      <span className="spacer" />
      <button
        type="button"
        className="pagebtn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('common.prev')}
      >
        <Icon name="chevronLeft" size={12} />
      </button>
      <span className="mono tiny">{t('common.page', { page, pages })}</span>
      <button
        type="button"
        className="pagebtn"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label={t('common.next')}
      >
        <Icon name="chevronRight" size={12} />
      </button>
    </div>
  )
}
