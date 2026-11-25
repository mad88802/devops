/**
 * T10.3 — Dashboard page with weekly and per-company filters.
 *
 * Owns the filter state and the company list, then renders the T10.2 dashboard
 * with the selected scope. `src/pages/recruiter/Dashboard.jsx` re-exports this
 * component as `Dashboard`.
 */
import { useState } from 'react'
import { api } from '../src/api/client.js'
import { useAsync } from '../src/lib/useAsync.js'
import { Dashboard } from '../T10.2/Dashboard.jsx'
import { DashboardFilters } from './DashboardFilters.jsx'
import { DEFAULT_WEEKS } from './filterParams.js'

export function DashboardPage() {
  const [weeks, setWeeks] = useState(DEFAULT_WEEKS)
  const [companyId, setCompanyId] = useState('')

  // Options for the company selector.
  const companyOptions = useAsync(() => api.companies.list(), [])
  const companies = companyOptions.data?.items ?? []
  const selectedCompany =
    companies.find((company) => String(company.id) === companyId) ?? null

  return (
    <Dashboard
      weeks={weeks}
      companyId={companyId}
      companyName={selectedCompany?.name ?? null}
      headerActions={
        <DashboardFilters
          companyId={companyId}
          weeks={weeks}
          companies={companies}
          onCompanyChange={setCompanyId}
          onWeeksChange={setWeeks}
          onClear={() => {
            setCompanyId('')
            setWeeks(DEFAULT_WEEKS)
          }}
        />
      }
    />
  )
}
