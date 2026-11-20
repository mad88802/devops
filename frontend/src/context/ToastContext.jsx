import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import { useI18n } from '../i18n/index.jsx'

const ToastContext = createContext(null)

const ICONS = { success: 'check', error: 'alert', warn: 'alert', default: 'info' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)
  const { t } = useI18n()

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast) => {
      const id = ++counter.current
      setToasts((current) => [...current.slice(-3), { id, tone: 'default', ...toast }])
      window.setTimeout(() => dismiss(id), toast.duration ?? 5200)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <Icon name={ICONS[toast.tone] ?? 'info'} size={15} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="toast__title">{toast.title}</div>
              {toast.body ? <div className="toast__body">{toast.body}</div> : null}
            </div>
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'var(--ink-faint)', width: 20, height: 20 }}
              onClick={() => dismiss(toast.id)}
              aria-label={t('common.close')}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
