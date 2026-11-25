import { useEffect, useState } from 'react'
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
  const [railHidden, setRailHidden] = useState(
    () => localStorage.getItem('verdict.railHidden') === '1',
  )
  const [railWidth, setRailWidth] = useState(() => {
    const saved = Number(localStorage.getItem('verdict.railWidth'))
    return Number.isFinite(saved) && saved >= 200 && saved <= 420 ? saved : 236
  })

  useEffect(() => {
    localStorage.setItem('verdict.railHidden', railHidden ? '1' : '0')
  }, [railHidden])

  useEffect(() => {
    localStorage.setItem('verdict.railWidth', String(railWidth))
  }, [railWidth])

  /** Drag the right edge of the rail to resize it, from 200 to 420 px. */
  function startResize(event) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = railWidth

    function onMove(moveEvent) {
      setRailWidth(Math.min(420, Math.max(200, startWidth + moveEvent.clientX - startX)))
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.classList.remove('is-resizing')
    }

    document.body.classList.add('is-resizing')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const kind = user?.kind ?? 'candidate'
  const groups = NAV[kind] ?? NAV.candidate
  const section = SECTION_OF.find(([prefix]) => location.pathname.startsWith(prefix))?.[1]

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

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
    <div
      className={`shell${railHidden ? ' shell--rail-hidden' : ''}`}
      style={{ '--rail-width': `${railWidth}px` }}
    >
      <aside className="rail">
        <span className="rail__ball rail__ball--1" aria-hidden="true" />
        <span className="rail__ball rail__ball--2" aria-hidden="true" />
        <span className="rail__ball rail__ball--3" aria-hidden="true" />
        <span className="rail__ball rail__ball--4" aria-hidden="true" />
        <span className="rail__ball rail__ball--5" aria-hidden="true" />
        <span
          className="rail__resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={t('topbar.resizeMenu')}
          title={t('topbar.resizeMenu')}
          onPointerDown={startResize}
        />
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
          <div className="topbar__nav">
            <button
              type="button"
              className="icon-btn icon-btn--ink"
              onClick={() => setRailHidden((value) => !value)}
              aria-label={t(railHidden ? 'topbar.showMenu' : 'topbar.hideMenu')}
              title={t(railHidden ? 'topbar.showMenu' : 'topbar.hideMenu')}
            >
              <Icon name={railHidden ? 'menu' : 'panelLeft'} size={16} />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--ink"
              onClick={goBack}
              aria-label={t('topbar.back')}
              title={t('topbar.back')}
            >
              <Icon name="arrowLeft" size={16} />
            </button>
          </div>

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
