/**
 * Public home page.
 *
 * A visitor who is not signed in lands here instead of being bounced straight
 * to the login form. Signed-in users are sent to their role home, exactly as
 * before.
 */
import { Link, Navigate } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { LANGUAGES, useI18n } from '../i18n/index.jsx'
import { homeFor } from '../lib/routes.js'
import { RULE_BY_CODE } from '../lib/rules.js'

function Brand() {
  const { t } = useI18n()
  return (
    <Link to="/" className="home__brand" aria-label={t('app.name')}>
      <span className="brand__mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <span className="home__brand-name">{t('app.name')}</span>
        <span className="home__brand-sub">{t('app.tagline')}</span>
      </span>
    </Link>
  )
}

const STEPS = [
  { number: '01', icon: 'file', title: 'home.how.step1.title', body: 'home.how.step1.body' },
  { number: '02', icon: 'scale', title: 'home.how.step2.title', body: 'home.how.step2.body' },
  { number: '03', icon: 'book', title: 'home.how.step3.title', body: 'home.how.step3.body' },
]

export function Home() {
  const { user } = useAuth()
  const { t, lang, setLang } = useI18n()

  const rule = RULE_BY_CODE.R1

  return (
    <div className="home">
      <header className="home__nav">
        <Brand />

        <nav className="home__links" aria-label={t('app.name')}>
          <a href="#how">{t('home.nav.how')}</a>
          <a href="#rules">{t('home.nav.rules')}</a>
        </nav>

        <div className="home__nav-right">
          <div className="home__lang" role="group" aria-label={t('topbar.language')}>
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                aria-pressed={lang === language.code}
                onClick={() => setLang(language.code)}
              >
                {language.label}
              </button>
            ))}
          </div>

          {user ? (
            <>
              <Link className="btn btn--secondary btn--sm" to={homeFor(user)}>
                <Icon name="user" size={14} />
                {user.fullName || user.name || t('nav.inbox')}
              </Link>
              <Link className="btn btn--primary btn--sm" to={homeFor(user)}>
                {t('home.hero.goToWorkspace')}
                <Icon name="arrowRight" size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link className="btn btn--ghost btn--sm" to="/login">
                {t('home.nav.signin')}
              </Link>
              <Link className="btn btn--primary btn--sm" to="/login?mode=signup">
                {t('home.nav.start')}
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="home__hero">
          <div className="home__hero-copy">
            <span className="home__eyebrow">
              <Icon name="spark" size={13} />
              {t('home.hero.eyebrow')}
            </span>

            <h1>
              {t('home.hero.title')} <em>{t('home.hero.titleAccent')}</em>
            </h1>

            <p className="home__hero-body">{t('home.hero.body')}</p>

            <div className="home__hero-actions">
              {user ? (
                <>
                  <Link className="btn btn--primary" to={homeFor(user)}>
                    {t('home.hero.goToWorkspace')}
                    <Icon name="arrowRight" size={15} />
                  </Link>
                  <Link className="btn btn--secondary" to="/login">
                    {t('topbar.signOut')}
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn btn--primary" to="/login?mode=signup">
                    {t('home.hero.primary')}
                    <Icon name="arrowRight" size={15} />
                  </Link>
                  <Link className="btn btn--secondary" to="/login">
                    {t('home.hero.secondary')}
                  </Link>
                </>
              )}
            </div>

            <p className="home__hero-note">
              <Icon name="info" size={12} />
              {t('home.hero.note')}
            </p>
          </div>

          <div className="home__verdict" aria-label={t('home.card.label')}>
            <div className="home__verdict-head">
              <span>{t('home.card.label')}</span>
              <span className="status status--fake">{t('status.F')}</span>
            </div>

            <div className="home__verdict-title">{t('home.card.title')}</div>
            <div className="home__verdict-company">{t('home.card.company')}</div>

            <div className="home__verdict-rule">
              <span className="mono">{rule.code}</span>
              <span>{rule.name}</span>
            </div>

            <div className="home__verdict-score">
              <div>
                <div className="home__verdict-number">{rule.score}</div>
                <div className="tiny faint">{t('home.card.scoreLabel')}</div>
              </div>
              <div className="home__verdict-meter" aria-hidden="true">
                <span style={{ width: `${rule.score}%` }} />
              </div>
            </div>

            <p className="home__verdict-note">{t('home.card.note')}</p>
          </div>
        </section>

        <section className="home__stats" aria-label={t('home.stats.label')}>
          <div className="home__stat">
            <b>{t('home.stats.rules.value')}</b>
            <span>{t('home.stats.rules.label')}</span>
          </div>
          <div className="home__stat">
            <b>{t('home.stats.score.value')}</b>
            <span>{t('home.stats.score.label')}</span>
          </div>
          <div className="home__stat">
            <b>{t('home.stats.roles.value')}</b>
            <span>{t('home.stats.roles.label')}</span>
          </div>
        </section>

        <section className="home__section" id="how">
          <div className="home__section-head">
            <h2>{t('home.how.title')}</h2>
            <p>{t('home.how.sub')}</p>
          </div>

          <div className="home__steps">
            {STEPS.map((step) => (
              <article className="home__step" key={step.number}>
                <span className="home__step-number">{step.number}</span>
                <span className="home__step-icon">
                  <Icon name={step.icon} size={18} />
                </span>
                <h3>{t(step.title)}</h3>
                <p>{t(step.body)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home__rules" id="rules">
          <div>
            <span className="home__eyebrow home__eyebrow--dark">
              <Icon name="book" size={13} />
              {t('home.rules.eyebrow')}
            </span>
            <h2>{t('home.rules.title')}</h2>
            <p>{t('home.rules.body')}</p>
          </div>

          <div className="home__rule-list">
            {['R1', 'R2', 'R3', 'R4', 'R8'].map((code) => {
              const entry = RULE_BY_CODE[code]
              return (
                <div className="home__rule" key={code}>
                  <span className={`home__rule-code home__rule-code--${entry.group}`}>
                    {code}
                  </span>
                  <span className="home__rule-name">{entry.name}</span>
                  <span className="home__rule-score">{entry.score}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="home__cta">
          <div>
            <h2>{t('home.cta.title')}</h2>
            <p>{t('home.cta.body')}</p>
          </div>
          <Link className="btn btn--primary" to={user ? homeFor(user) : "/login?mode=signup"}>
            {user ? t('home.hero.goToWorkspace') : t('home.cta.button')}
            <Icon name="arrowRight" size={15} />
          </Link>
        </section>
      </main>

      <footer className="home__footer">
        <Brand />
        <p>{t('home.footer.note')}</p>
      </footer>
    </div>
  )
}
