/**
 * T5.3 — Risk score display.
 *
 * A measured scale from 0 to 100 with ten ticks, not a progress bar: the score
 * is a reading on an instrument a recruiter has to justify.
 */
import { clamp } from '../src/lib/format.js'
import { riskBand } from './statusMeta.js'

export function RiskRuler({ score = 0, size, showScale = false, label }) {
  const band = riskBand(score)
  const value = clamp(Number(score) || 0, 0, 100)

  return (
    <div className={`risk risk--${band}${size === 'lg' ? ' risk--lg' : ''}`}>
      <span className="risk__value" aria-hidden="true">
        {value}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="risk__track"
          role="img"
          aria-label={label ? `${label}: ${value}/100` : `${value}/100`}
        >
          <div className="risk__fill" style={{ width: `${value}%` }} />
        </div>
        {showScale ? (
          <div className="risk__scale">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
