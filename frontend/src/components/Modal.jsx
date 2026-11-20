import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n/index.jsx'
import { Icon } from './Icon.jsx'

export function Modal({ open, onClose, title, subtitle, children, footer, wide, drawer }) {
  const { t } = useI18n()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={`scrim${drawer ? ' scrim--right' : ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={`${drawer ? 'drawer' : 'modal'}${wide && !drawer ? ' modal--wide' : ''}`}
        style={{ outline: 'none' }}
      >
        <header className="modal__head">
          <div style={{ minWidth: 0 }}>
            <div className="modal__title">{title}</div>
            {subtitle ? <div className="modal__sub">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            className="icon-btn modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <Icon name="x" size={15} />
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer ? <footer className="modal__foot">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  busy = false,
}) {
  const { t } = useI18n()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn btn--${tone === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <span className="spinner" /> : null}
            {confirmLabel ?? t('common.confirm')}
          </button>
        </>
      }
    >
      <p className="small" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        {body}
      </p>
    </Modal>
  )
}
