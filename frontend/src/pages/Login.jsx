import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { RULE_BY_CODE, evaluateRule } from '../lib/rules.js'
import { api } from '../api/client.js'
import { Icon } from '../components/Icon.jsx'
import { ConditionLedger } from '../components/Ledger.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import { homeFor } from '../lib/routes.js'

/**
 * The hero is the product's own object: three rules, resolved, exactly as the
 * recruiter will see them. No illustration, no marketing line.
 */
const SPECIMENS = [
  {
    code: 'R1',
    facts: {
      company: { hasProfile: 0 },
      salary: { salaryLevel: 2 },
      fee: { feeRequested: 1 },
    },
  },
  {
    code: 'R4',
    facts: {
      salary: { salaryLevel: 1 },
      content: { descriptionQuality: 0, urgencyLanguage: 2 },
    },
  },
  {
    code: 'R8',
    facts: {
      company: { hasProfile: 1, websiteVerified: 1 },
      salary: { salaryLevel: 0 },
      fee: { feeRequested: 0 },
      content: { personalInfoRequested: 0 },
    },
  },
]

const ROLES = [
  { role: 'recruiter', label: 'auth.as.recruiter', desc: 'auth.as.recruiterDesc', icon: 'scale' },
  { role: 'candidate', label: 'auth.as.candidate', desc: 'auth.as.candidateDesc', icon: 'search' },
  { role: 'admin', label: 'auth.as.admin', desc: 'auth.as.adminDesc', icon: 'shield' },
]

export function Login() {
  const { user, login } = useAuth()
  const { t } = useI18n()
  const { push } = useToast()
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)

  if (user) return <Navigate to={homeFor(user)} replace />

  async function signIn(role) {
    setPending(role)
    try {
      const account = await login(role)
      navigate(homeFor(account), { replace: true })
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
      setPending(null)
    }
  }

  return (
    <div className="auth">
      <section className="auth__left">
        <div className="auth__brand">
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="auth__brand-name">{t('app.name')}</span>
        </div>

        <div className="auth__main">
          <h1 className="auth__lede">{t('auth.lede')}</h1>
          <p className="auth__sub">{t('auth.sub')}</p>

          <div className="auth__roles">
            {ROLES.map((entry) => (
              <button
                key={entry.role}
                type="button"
                className="auth__role"
                onClick={() => signIn(entry.role)}
                disabled={Boolean(pending)}
              >
                <span className="auth__role-icon">
                  {pending === entry.role ? (
                    <span className="spinner" />
                  ) : (
                    <Icon name={entry.icon} size={17} />
                  )}
                </span>
                <span className="auth__role-text">
                  <b>{t(entry.label)}</b>
                  <span>{t(entry.desc)}</span>
                </span>
                <span className="auth__role-arrow">
                  <Icon name="arrowRight" size={15} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="auth__foot">
          <Icon name="info" size={13} />
          <span>{t('auth.demoNote', { api: <code>{api.baseUrl}</code> })}</span>
        </div>
      </section>

      <section className="auth__right" aria-label={t('auth.specimenTitle')}>
        <div className="auth__specimen-head">
          <h2>{t('auth.specimenTitle')}</h2>
        </div>
        <p className="small muted" style={{ marginTop: -10 }}>
          {t('auth.specimenSub')}
        </p>

        {SPECIMENS.map(({ code, facts }) => {
          const rule = RULE_BY_CODE[code]
          const entry = evaluateRule(rule, facts)
          return (
            <article className="specimen" key={code}>
              <div className="specimen__head">
                <span className="specimen__code">{code}</span>
                <span className="specimen__name">{rule.name}</span>
              </div>
              <ConditionLedger conditions={entry.conditions} />
              <div className="specimen__acting">
                <span>acting</span>
                <b>
                  P.Status(&quot;{rule.group}&quot;) and P.RiskScore({rule.score})
                </b>
              </div>
            </article>
          )
        })}

        <p className="hint" style={{ marginTop: 6, maxWidth: '48ch' }}>
          {t('auth.specimenFoot')}
        </p>
      </section>
    </div>
  )
}
