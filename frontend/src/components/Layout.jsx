import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { LANGUAGES, useI18n } from '../i18n/index.jsx'
import { initials } from '../lib/format.js'
import { Icon } from './Icon.jsx'
import { ConfirmDialog } from './Modal.jsx'

const NAV = {
  recruiter: [
    {
      label: 'nav.group.screening',
      items: [
        { to: '/recruiter/inbox', label: 'nav.inbox', icon: 'inbox' },
        { to: '/recruiter/postings/new', label: 'nav.newPosting', icon: 'plus' },
      ],
    },
    {
      label: 'nav.group.workspace',
      items: [{ to: '/recruiter/dashboard', label: 'nav.dashboard', icon: 'activity' }],
    },
  ],
  candidate: [
    {
      label: 'nav.group.workspace',
      items: [{ to: '/candidate/browse', label: 'nav.browse', icon: 'search' }],
    },
  ],
  admin: [
    {
      label: 'nav.group.admin',
      items: [
        { to: '/admin/companies', label: 'nav.companies', icon: 'building' },
        { to: '/admin/recruiters', label: 'nav.recruiters', icon: 'users' },
        { to: '/admin/rules', label: 'nav.rules', icon: 'book' },
      ],
    },
  ],
}

const SECTION_OF = [
  ['/recruiter/inbox', 'nav.inbox'],
  ['/recruiter/postings/new', 'nav.newPosting'],
  ['/recruiter/dashboard', 'nav.dashboard'],
  ['/recruiter/postings', 'nav.inbox'],
  ['/candidate/browse', 'nav.browse'],
  ['/candidate/postings', 'nav.browse'],
  ['/admin/companies', 'nav.companies'],
  ['/admin/recruiters', 'nav.recruiters'],
  ['/admin/rules', 'nav.rules'],
]

function Brand() {
  const { t } = useI18n()
  return (
    <NavLink to="/" className="brand" aria-label={t('app.name')}>
      <span className="brand__mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <span className="brand__name">{t('app.name')}</span>
        <span className="brand__sub">{t('app.tagline')}</span>
      </span>
    </NavLink>
  )
}

export function Layout() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useI18n()
  const { push } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  const kind = user?.kind ?? 'candidate'
  const groups = NAV[kind] ?? NAV.candidate
  const section = SECTION_OF.find(([prefix]) => location.pathname.startsWith(prefix))?.[1]

  async function confirmReset() {
    setResetting(true)
    try {
      await api.resetDemoData()
      push({ tone: 'success', title: t('topbar.resetDone') })
      setResetOpen(false)
      navigate(0)
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail__head">
          <Brand />
        </div>

        <nav className="rail__nav" aria-label={t('app.name')}>
          {groups.map((group) => (
            <div className="navgroup" key={group.label}>
              <div className="navgroup__label">{t(group.label)}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/recruiter/inbox'}
                  className={({ isActive }) => `navlink${isActive ? ' is-active' : ''}`}
                >
                  <Icon name={item.icon} size={15} />
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="rail__foot">
          <span className="avatar">{initials(user?.name, user?.surname)}</span>
          <span className="rail__user">
            <b>{user?.fullName ?? '—'}</b>
            <span>{user?.email}</span>
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={logout}
            aria-label={t('topbar.signOut')}
            title={t('topbar.signOut')}
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__section">
            <span>{t('app.name')}</span>
            <span className="topbar__sep">/</span>
            <b>{section ? t(section) : ''}</b>
          </div>

          <div className="topbar__right">
            <span className="demo-pill">{t('topbar.demo')}</span>

            <div className="langtoggle" role="group" aria-label={t('topbar.language')}>
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

            <button
              type="button"
              className="icon-btn"
              style={{ color: 'var(--ink-mute)' }}
              onClick={() => setResetOpen(true)}
              aria-label={t('topbar.reset')}
              title={t('topbar.reset')}
            >
              <Icon name="refresh" size={15} />
            </button>

            <button
              type="button"
              className="icon-btn"
              style={{ color: 'var(--ink-mute)' }}
              onClick={logout}
              aria-label={t('topbar.signOut')}
              title={t('topbar.signOut')}
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </header>

        <Outlet />
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={confirmReset}
        title={t('topbar.resetTitle')}
        body={t('topbar.resetBody')}
        confirmLabel={t('topbar.reset')}
        busy={resetting}
      />
    </div>
  )
}
