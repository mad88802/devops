/**
 * T7.3 — Report button, as a dialog.
 *
 * Cd.Report(P, Reason). The response tells us which of R9 / R10 fired, and the
 * toast repeats it, so the candidate sees the effect of their report.
 * `src/components/ReportDialog.jsx` is a re-export shim.
 */
import { useEffect, useState } from 'react'
import { REPORT_REASONS } from '../lib/reportReasons.js'
import { createReport } from '../api/reportApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import { Modal } from './Modal.jsx'

/**
 * T7.3 — Report button, as a dialog.
 *
 * Cd.Report(P, Reason). The response tells us which of R9 / R10 fired, and the
 * toast repeats it, so the candidate sees the effect of their report.
 *
 * Opened from src/pages/candidate/Browse.jsx and
 * src/pages/candidate/PostingView.jsx.
 */
export function ReportDialog({ open, posting, onClose, onReported }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const { push } = useToast()
  const [reason, setReason] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setReason(1)
  }, [open])

  async function submit() {
    setSaving(true)
    try {
      const response = await createReport({
        postingId: posting.id,
        candidateId: user.id,
        reason,
      })

      const fired = (response.effects ?? []).map((effect) => effect.rule)
      const effect = fired.includes('R10')
        ? t('report.effectR10')
        : fired.includes('R9')
          ? t('report.effectR9')
          : t('report.effectNone')

      push({
        tone: 'success',
        title: t('report.done'),
        body: t('report.doneBody', { count: response.reportCount, effect }),
      })
      onReported?.(response)
      onClose()
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('report.title')}
      subtitle={posting?.title}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn--danger" onClick={submit} disabled={saving}>
            {saving ? <span className="spinner" /> : null}
            {t('report.submit')}
          </button>
        </>
      }
    >
      <p className="small muted" style={{ lineHeight: 1.6 }}>
        {t('report.sub')}
      </p>

      <fieldset style={{ border: 0, padding: 0, margin: '16px 0 0' }}>
        <legend className="field__label" style={{ marginBottom: 8 }}>
          {t('report.reason')}
        </legend>
        <div className="stack-sm">
          {REPORT_REASONS.map((option) => (
            <label
              key={option.value}
              className={`choice${reason === option.value ? ' is-on' : ''}`}
            >
              <input
                type="radio"
                name="report-reason"
                value={option.value}
                checked={reason === option.value}
                onChange={() => setReason(option.value)}
              />
              <span>{t(option.label)}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </Modal>
  )
}
