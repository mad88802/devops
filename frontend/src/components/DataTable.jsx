/**
 * T7.1 — Table shell for the posting list (and admin tables): columns,
 * loading skeletons, empty state and keyboard-reachable rows.
 */
import { useI18n } from '../i18n/index.jsx'

/**
 * Columns: [{ key, header, render?, align?, width?, className? }]
 * Clickable rows stay keyboard reachable (Enter activates them).
 */
export function DataTable({
  columns,
  rows = [],
  rowKey = 'id',
  onRowClick,
  loading = false,
  skeletonRows = 6,
  empty = null,
}) {
  const { t } = useI18n()

  if (loading && rows.length === 0) {
    return (
      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <td key={column.key}>
                    <span
                      className="sk"
                      style={{ width: `${55 + ((rowIndex * 13 + columnIndex * 21) % 40)}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="tablewrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === 'right' ? 'cell-right' : undefined}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                {empty ?? <div className="empty">{t('common.none')}</div>}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row[rowKey]}
                data-clickable={onRowClick ? 'true' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[column.align === 'right' ? 'cell-right' : '', column.className ?? '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
