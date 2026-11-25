/**
 * Application routes and role guards.
 *
 * Task mapping:
 *   /recruiter/postings/new   T4.1 / T4.2 / T4.3  (PostingForm)
 *   /recruiter/postings/:id   T5.1 / T5.2 / T5.3  (PostingDetail)
 *   /recruiter/inbox          T7.1 / T7.2         (Inbox)
 *   /candidate/browse         T7.1 / T7.2 / T7.3  (Browse)
 *   /candidate/postings/:id   T5.1 / T5.3 / T7.3  (PostingView)
 *   /recruiter/dashboard      T10.2 / T10.3       (DashboardPage)
 *
 * Route-level page imports point at the shims under `src/pages/`, which
 * re-export the implementation from the matching `T#.#` task folder.
 */
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { Empty } from './components/Small.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { I18nProvider, useI18n } from './i18n/index.jsx'
import { homeFor } from './lib/routes.js'
import { Companies } from './pages/admin/Companies.jsx'
import { Recruiters } from './pages/admin/Recruiters.jsx'
import { Rules } from './pages/admin/Rules.jsx'
import { Browse } from './pages/candidate/Browse.jsx'
import { PostingView } from './pages/candidate/PostingView.jsx'
import { Home } from './pages/Home.jsx'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/recruiter/Dashboard.jsx'
import { Inbox } from './pages/recruiter/Inbox.jsx'
import { PostingDetail } from './pages/recruiter/PostingDetail.jsx'
import { PostingForm } from './pages/recruiter/PostingForm.jsx'

/** Sends an unauthenticated visitor to the sign-in, and a wrong role home. */
function Shield({ kind, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (kind && user.kind !== kind) return <Navigate to={homeFor(user)} replace />
  return children
}

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="page page--narrow" style={{ paddingTop: 64 }}>
      <Empty
        icon="alert"
        title={t('common.notFound')}
        hint={t('error.routeNotFound')}
        action={
          <Link className="btn btn--secondary" to="/">
            {t('common.back')}
          </Link>
        }
      />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public pages: home first, sign-in / sign-up next. */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <Shield>
                    <Layout />
                  </Shield>
                }
              >
                <Route path="/recruiter" element={<Navigate to="/recruiter/inbox" replace />} />
                {/* T7.1 / T7.2 — posting list, search and status filter. */}
                <Route
                  path="/recruiter/inbox"
                  element={
                    <Shield kind="recruiter">
                      <Inbox />
                    </Shield>
                  }
                />
                {/* T4.1 / T4.2 / T4.3 — posting form. */}
                <Route
                  path="/recruiter/postings/new"
                  element={
                    <Shield kind="recruiter">
                      <PostingForm />
                    </Shield>
                  }
                />
                {/* T5.1 / T5.2 / T5.3 — result page. */}
                <Route
                  path="/recruiter/postings/:id"
                  element={
                    <Shield kind="recruiter">
                      <PostingDetail />
                    </Shield>
                  }
                />
                {/* T10.2 — charts. T10.3 — weekly/per-company filters. */}
                <Route
                  path="/recruiter/dashboard"
                  element={
                    <Shield kind="recruiter">
                      <Dashboard />
                    </Shield>
                  }
                />

                <Route path="/candidate" element={<Navigate to="/candidate/browse" replace />} />
                {/* T7.1 / T7.2 / T7.3 / T5.3 — candidate browse + report. */}
                <Route
                  path="/candidate/browse"
                  element={
                    <Shield kind="candidate">
                      <Browse />
                    </Shield>
                  }
                />
                {/* T5.1 / T5.3 / T7.3 — candidate result view + report. */}
                <Route
                  path="/candidate/postings/:id"
                  element={
                    <Shield kind="candidate">
                      <PostingView />
                    </Shield>
                  }
                />

                <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />
                <Route
                  path="/admin/companies"
                  element={
                    <Shield kind="admin">
                      <Companies />
                    </Shield>
                  }
                />
                <Route
                  path="/admin/recruiters"
                  element={
                    <Shield kind="admin">
                      <Recruiters />
                    </Shield>
                  }
                />
                <Route
                  path="/admin/rules"
                  element={
                    <Shield kind="admin">
                      <Rules />
                    </Shield>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
