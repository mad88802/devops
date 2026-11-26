/**
 * Public sign-in / sign-up page.
 *
 * There are no example accounts: the account store starts empty and the first
 * account is created through the Sign up tab. The layout follows the supplied
 * reference — a blue WELCOME panel on the left and a white form on the right.
 */
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import { homeFor } from '../lib/routes.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY_SIGNIN = { email: '', password: '', remember: true }
const EMPTY_SIGNUP = {
  name: '',
  surname: '',
  email: '',
  kind: 'recruiter',
  password: '',
  confirm: '',
  remember: true,
}

export function Login() {
  const { user, login, signup } = useAuth()
  const { t } = useI18n()
  const { push } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [signin, setSignin] = useState(EMPTY_SIGNIN)
  const [signupValues, setSignupValues] = useState(EMPTY_SIGNUP)
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  }, [searchParams])

  if (user) return <Navigate to={homeFor(user)} replace />

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setFormError('')
    setShowPassword(false)
  }

  function setSigninField(key, value) {
    setSignin((current) => ({ ...current, [key]: value }))
    setFormError('')
    setErrors((current) => ({ ...current, [`auth.${key}`]: undefined }))
  }

  function setSignupField(key, value) {
    setSignupValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [`auth.${key}`]: undefined }))
  }

  async function submitSignin(event) {
    event.preventDefault()
    const found = {}
    const email = signin.email.trim().toLowerCase()

    if (!email) found['auth.email'] = 'error.required'
    else if (!EMAIL_RE.test(email)) found['auth.email'] = 'error.email'
    if (!signin.password) found['auth.password'] = 'error.required'

    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setPending(true)
    try {
      const account = await login(
        { email, password: signin.password },
        { remember: signin.remember },
      )
      navigate(homeFor(account), { replace: true })
    } catch (error) {
      if (error.fields) {
        setErrors(error.fields)
      } else if (error.status === 401 || error.key === 'error.credentials') {
        // Shown in red under the password field, not as a toast.
        setFormError(t('error.credentials'))
      } else {
        setFormError(t(error.key ?? 'error.server'))
        push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
      }
    } finally {
      setPending(false)
    }
  }

  async function submitSignup(event) {
    event.preventDefault()
    const found = {}
    const email = signupValues.email.trim().toLowerCase()

    if (!signupValues.name.trim()) found['auth.name'] = 'error.required'
    if (!signupValues.surname.trim()) found['auth.surname'] = 'error.required'
    if (!email) found['auth.email'] = 'error.required'
    else if (!EMAIL_RE.test(email)) found['auth.email'] = 'error.email'
    if (!signupValues.password) found['auth.password'] = 'error.required'
    else if (signupValues.password.length < 8) found['auth.password'] = 'error.passwordShort'
    if (signupValues.confirm !== signupValues.password) {
      found['auth.confirm'] = 'error.passwordMismatch'
    }

    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setPending(true)
    try {
      const account = await signup(
        {
          name: signupValues.name.trim(),
          surname: signupValues.surname.trim(),
          email,
          password: signupValues.password,
          kind: signupValues.kind,
          role: 'R',
        },
        { remember: signupValues.remember },
      )
      push({ tone: 'success', title: t('auth.signupDone'), body: t('auth.signupDoneBody') })
      navigate(homeFor(account), { replace: true })
    } catch (error) {
      if (error.fields) setErrors(error.fields)
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setPending(false)
    }
  }

  function forgotPassword() {
    push({ title: t('auth.forgot'), body: t('auth.forgotBody') })
  }

  return (
    <div className="authpage">
      <div className="authcard">
        <aside className="authcard__aside">
          <span className="authcard__blob authcard__blob--1" aria-hidden="true" />
          <span className="authcard__blob authcard__blob--2" aria-hidden="true" />
          <span className="authcard__blob authcard__blob--3" aria-hidden="true" />

          <div className="authcard__brand">
            <span className="brand__mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="authcard__brand-name">{t('app.name')}</span>
          </div>

          <div className="authcard__welcome">
            <h1>{t('auth.welcome')}</h1>
            <p className="authcard__welcome-sub">{t('auth.welcomeSub')}</p>
            <p className="authcard__welcome-body">{t('auth.welcomeBody')}</p>
          </div>

          <p className="authcard__foot">
            <Icon name="shield" size={13} />
            {t('auth.welcomeFoot')}
          </p>
        </aside>

        <section className="authcard__panel">
          <div className="authcard__tabs" role="tablist" aria-label={t('auth.formTitle')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={mode === 'signin' ? 'is-active' : ''}
              onClick={() => switchMode('signin')}
            >
              {t('auth.signin')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'is-active' : ''}
              onClick={() => switchMode('signup')}
            >
              {t('auth.signup')}
            </button>
          </div>

          {mode === 'signin' ? (
            <form className="authform" onSubmit={submitSignin} noValidate>
              <header className="authform__head">
                <h2>{t('auth.signin')}</h2>
                <p>{t('auth.signinSub')}</p>
              </header>

              <label className={`authfield${errors['auth.email'] ? ' is-invalid' : ''}`}>
                <span className="authfield__box">
                  <Icon name="user" size={16} />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={signin.email}
                    onChange={(event) => setSigninField('email', event.target.value)}
                  />
                </span>
                {errors['auth.email'] ? (
                  <span className="authfield__error">{t(errors['auth.email'])}</span>
                ) : null}
              </label>

              <label className={`authfield${errors['auth.password'] ? ' is-invalid' : ''}`}>
                <span className="authfield__box">
                  <Icon name="lock" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={signin.password}
                    onChange={(event) => setSigninField('password', event.target.value)}
                  />
                  <button
                    type="button"
                    className={`authfield__toggle${showPassword ? ' is-on' : ''}`}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                    title={showPassword ? t('auth.hide') : t('auth.show')}
                  >
                    <Icon
                      key={showPassword ? 'off' : 'on'}
                      name={showPassword ? 'eyeOff' : 'eye'}
                      size={17}
                    />
                  </button>
                </span>
                {errors['auth.password'] ? (
                  <span className="authfield__error">{t(errors['auth.password'])}</span>
                ) : null}
              </label>

              {formError ? (
                <div className="authform__error" role="alert">
                  <Icon name="alert" size={13} />
                  {formError}
                </div>
              ) : null}

              <div className="authform__row">
                <label className="authcheck">
                  <input
                    type="checkbox"
                    checked={signin.remember}
                    onChange={(event) => setSigninField('remember', event.target.checked)}
                  />
                  <span>{t('auth.remember')}</span>
                </label>
                <button type="button" className="authlink" onClick={forgotPassword}>
                  {t('auth.forgot')}
                </button>
              </div>

              <button type="submit" className="btn btn--primary authform__submit" disabled={pending}>
                {pending ? <span className="spinner" /> : null}
                {t('auth.signinCta')}
              </button>

              <p className="authform__switch">
                {t('auth.noAccount')}{' '}
                <button type="button" className="authlink" onClick={() => switchMode('signup')}>
                  {t('auth.signup')}
                </button>
              </p>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border, rgba(0,0,0,0.08))', textAlign: 'center' }}>
                <span className="tiny faint" style={{ display: 'block', marginBottom: 8 }}>
                  {t('topbar.demo')}
                </span>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setSigninField('email', 'amine.benkraouda@jobwatch.dz')
                      setSigninField('password', 'demo1234')
                    }}
                  >
                    Recruiter
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setSigninField('email', 'sofiane.hamidi@mail.dz')
                      setSigninField('password', 'demo1234')
                    }}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setSigninField('email', 'nadia.belkacem@jobwatch.dz')
                      setSigninField('password', 'demo1234')
                    }}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form className="authform" onSubmit={submitSignup} noValidate>
              <header className="authform__head">
                <h2>{t('auth.signup')}</h2>
                <p>{t('auth.signupSub')}</p>
              </header>

              <div className="authform__grid">
                <label className={`authfield${errors['auth.name'] ? ' is-invalid' : ''}`}>
                  <span className="authfield__box">
                    <Icon name="user" size={16} />
                    <input
                      type="text"
                      autoComplete="given-name"
                      placeholder={t('auth.firstName')}
                      value={signupValues.name}
                      onChange={(event) => setSignupField('name', event.target.value)}
                    />
                  </span>
                  {errors['auth.name'] ? (
                    <span className="authfield__error">{t(errors['auth.name'])}</span>
                  ) : null}
                </label>

                <label className={`authfield${errors['auth.surname'] ? ' is-invalid' : ''}`}>
                  <span className="authfield__box">
                    <Icon name="user" size={16} />
                    <input
                      type="text"
                      autoComplete="family-name"
                      placeholder={t('auth.lastName')}
                      value={signupValues.surname}
                      onChange={(event) => setSignupField('surname', event.target.value)}
                    />
                  </span>
                  {errors['auth.surname'] ? (
                    <span className="authfield__error">{t(errors['auth.surname'])}</span>
                  ) : null}
                </label>
              </div>

              <label className={`authfield${errors['auth.email'] ? ' is-invalid' : ''}`}>
                <span className="authfield__box">
                  <Icon name="user" size={16} />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={signupValues.email}
                    onChange={(event) => setSignupField('email', event.target.value)}
                  />
                </span>
                {errors['auth.email'] ? (
                  <span className="authfield__error">{t(errors['auth.email'])}</span>
                ) : null}
              </label>

              <label className="authfield">
                <span className="authfield__box authfield__box--select">
                  <Icon name="users" size={16} />
                  <select
                    aria-label={t('auth.roleLabel')}
                    value={signupValues.kind}
                    onChange={(event) => setSignupField('kind', event.target.value)}
                  >
                    <option value="recruiter">{t('auth.kind.recruiter')}</option>
                    <option value="candidate">{t('auth.kind.candidate')}</option>
                    <option value="admin">{t('auth.kind.admin')}</option>
                  </select>
                </span>
              </label>

              <label className={`authfield${errors['auth.password'] ? ' is-invalid' : ''}`}>
                <span className="authfield__box">
                  <Icon name="lock" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={signupValues.password}
                    onChange={(event) => setSignupField('password', event.target.value)}
                  />
                  <button
                    type="button"
                    className={`authfield__toggle${showPassword ? ' is-on' : ''}`}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                    title={showPassword ? t('auth.hide') : t('auth.show')}
                  >
                    <Icon
                      key={showPassword ? 'off' : 'on'}
                      name={showPassword ? 'eyeOff' : 'eye'}
                      size={17}
                    />
                  </button>
                </span>
                <span className="authfield__help">{t('auth.passwordHint')}</span>
                {errors['auth.password'] ? (
                  <span className="authfield__error">{t(errors['auth.password'])}</span>
                ) : null}
              </label>

              <label className={`authfield${errors['auth.confirm'] ? ' is-invalid' : ''}`}>
                <span className="authfield__box">
                  <Icon name="lock" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.confirmPlaceholder')}
                    value={signupValues.confirm}
                    onChange={(event) => setSignupField('confirm', event.target.value)}
                  />
                </span>
                {errors['auth.confirm'] ? (
                  <span className="authfield__error">{t(errors['auth.confirm'])}</span>
                ) : null}
              </label>

              <label className="authcheck">
                <input
                  type="checkbox"
                  checked={signupValues.remember}
                  onChange={(event) => setSignupField('remember', event.target.checked)}
                />
                <span>{t('auth.remember')}</span>
              </label>

              <button type="submit" className="btn btn--primary authform__submit" disabled={pending}>
                {pending ? <span className="spinner" /> : null}
                {t('auth.signupCta')}
              </button>

              <p className="authform__switch">
                {t('auth.haveAccount')}{' '}
                <button type="button" className="authlink" onClick={() => switchMode('signin')}>
                  {t('auth.signin')}
                </button>
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
