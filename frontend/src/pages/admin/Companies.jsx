import { useState } from 'react'
import { FIELD_INDEX, describeValue } from '../../../shared/fields.js'
import { api } from '../../api/client.js'
import { DataTable } from '../../components/DataTable.jsx'
import { FormField } from '../../components/Field.jsx'
import { Icon } from '../../components/Icon.jsx'
import { ConfirmDialog, Modal } from '../../components/Modal.jsx'
import { Empty, Notice } from '../../components/Small.jsx'
import { StatusBadge } from '../../components/Status.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { useAsync } from '../../lib/useAsync.js'

const FORM_KEYS = [
  'company.name',
  'company.country',
  'company.industry',
  'company.ageYears',
  'company.hasProfile',
  'company.websiteVerified',
  'company.postingsLast24h',
]

const EMPTY_COMPANY = {
  name: '',
  country: '',
  industry: '',
  ageYears: 1,
  hasProfile: 1,
  websiteVerified: 0,
  postingsLast24h: 0,
}

export function Companies() {
  const { t } = useI18n()
  const { push } = useToast()

  const [query, setQuery] = useState('')
  const [drawer, setDrawer] = useState(null) // { mode, company }
  const [values, setValues] = useState(EMPTY_COMPANY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [forceInfo, setForceInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(null)

  const list = useAsync(() => api.companies.list({ q: query.trim() }), [query])

  function openCreate() {
    setValues(EMPTY_COMPANY)
    setErrors({})
    setDrawer({ mode: 'create' })
  }

  function openEdit(company) {
    setValues({
      name: company.name,
      country: company.country,
      industry: company.industry,
      ageYears: company.ageYears,
      hasProfile: company.hasProfile,
      websiteVerified: company.websiteVerified,
      postingsLast24h: company.postingsLast24h,
    })
    setErrors({})
    setDrawer({ mode: 'edit', company })
  }

  async function save() {
    const found = {}
    if (!values.name.trim()) found.name = 'error.required'
    if (!values.country.trim()) found.country = 'error.required'
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }

    setSaving(true)
    try {
      if (drawer.mode === 'create') await api.companies.create(values)
      else await api.companies.update(drawer.company.id, values)
      push({ tone: 'success', title: t('admin.companies.saved') })
      setDrawer(null)
      list.reload()
    } catch (error) {
      if (error.fields) setErrors(error.fields)
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setSaving(false)
    }
  }

  async function toggleBlacklist(company) {
    try {
      await api.companies.setBlacklist(company.id, company.blacklisted === 1 ? 0 : 1)
      push({
        tone: 'success',
        title: company.blacklisted === 1 ? t('toast.unblacklisted') : t('toast.blacklisted'),
      })
      list.reload()
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    }
  }

  async function runCheck(company) {
    setChecking(company.id)
    try {
      const outcome = await api.companies.check(company.id)
      push({
        tone: outcome.fired ? 'warn' : 'success',
        title: outcome.fired ? t('admin.companies.checkFired') : t('admin.companies.checkClean'),
        body: outcome.fired
          ? t('admin.companies.checkFiredBody')
          : t('admin.companies.checkCleanBody'),
      })
      list.reload()
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setChecking(null)
    }
  }

  async function confirmDelete(force) {
    setBusy(true)
    try {
      await api.companies.remove(deleteTarget.id, { force })
      push({ tone: 'success', title: t('admin.companies.deleted') })
      setDeleteTarget(null)
      setForceInfo(null)
      list.reload()
    } catch (error) {
      if (error.status === 409) setForceInfo({ count: error.meta?.count ?? 0 })
      else push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('common.name'),
      render: (company) => (
        <div style={{ minWidth: 0 }}>
          <div className="table__title">{company.name}</div>
          <div className="table__sub">
            {company.country} · {company.industry || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'age',
      header: t('admin.companies.age'),
      render: (company) => <span className="cell-mono">{company.ageYears} y</span>,
    },
    {
      key: 'hasProfile',
      header: t('admin.companies.profile'),
      render: (company) => (
        <span className="row" style={{ gap: 6 }}>
          <span className="indrow__code">{company.hasProfile}</span>
          <span className="small muted">
            {describeValue('company.hasProfile', company.hasProfile, t)}
          </span>
        </span>
      ),
    },
    {
      key: 'website',
      header: t('admin.companies.website'),
      render: (company) => (
        <span className="row" style={{ gap: 6 }}>
          <span className="indrow__code">{company.websiteVerified}</span>
          <span className="small muted">
            {describeValue('company.websiteVerified', company.websiteVerified, t)}
          </span>
        </span>
      ),
    },
    {
      key: 'fake',
      header: t('admin.companies.fake'),
      render: (company) => (
        <span className="row" style={{ gap: 6 }}>
          <span className="cell-mono">{company.fakePostingsCount}</span>
          {company.fakePostingsCount >= 3 && company.blacklisted !== 1 ? (
            <span className="elig">{t('admin.companies.eligible')}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'blacklisted',
      header: t('admin.companies.blacklist'),
      render: (company) =>
        company.blacklisted === 1 ? <StatusBadge status="F" /> : <span className="faint">—</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (company) => (
        <span className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="icon-btn icon-btn--ink"
            title={t('admin.companies.check')}
            aria-label={t('admin.companies.check')}
            disabled={checking === company.id}
            onClick={() => runCheck(company)}
          >
            {checking === company.id ? <span className="spinner" /> : <Icon name="shield" size={14} />}
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--ink"
            title={
              company.blacklisted === 1
                ? t('admin.companies.unblacklist')
                : t('admin.companies.blacklist')
            }
            aria-label={
              company.blacklisted === 1
                ? t('admin.companies.unblacklist')
                : t('admin.companies.blacklist')
            }
            onClick={() => toggleBlacklist(company)}
          >
            <Icon name={company.blacklisted === 1 ? 'check' : 'flag'} size={14} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--ink"
            title={t('common.edit')}
            aria-label={t('common.edit')}
            onClick={() => openEdit(company)}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--ink"
            title={t('common.delete')}
            aria-label={t('common.delete')}
            onClick={() => {
              setDeleteTarget(company)
              setForceInfo(null)
            }}
          >
            <Icon name="trash" size={14} />
          </button>
        </span>
      ),
    },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head__text">
          <h1>{t('admin.companies.title')}</h1>
          <p>{t('admin.companies.sub')}</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Icon name="plus" size={14} />
            {t('admin.companies.add')}
          </button>
        </div>
      </div>

      <Notice icon="info" style={{ marginBottom: 14 }}>
        {t('detail.blacklistedCompany')}
      </Notice>

      <div className="card">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={14} />
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('common.search')}
              aria-label={t('common.search')}
            />
          </label>
          <span className="spacer" />
          <span className="small muted">{list.data?.items.length ?? 0}</span>
        </div>

        {list.error ? (
          <Notice tone="danger" icon="alert" style={{ margin: 18 }}>
            {t(list.error.key ?? 'error.server')}{' '}
            <button type="button" className="linkbtn" onClick={list.reload}>
              {t('common.retry')}
            </button>
          </Notice>
        ) : (
          <DataTable
            columns={columns}
            rows={list.data?.items ?? []}
            loading={list.status === 'loading'}
            empty={
              <Empty
                icon="building"
                title={t('admin.companies.empty.title')}
                hint={t('admin.companies.empty.hint')}
                action={
                  <button type="button" className="btn btn--secondary" onClick={openCreate}>
                    {t('admin.companies.add')}
                  </button>
                }
              />
            }
          />
        )}
      </div>

      <Modal
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        drawer
        title={drawer?.mode === 'edit' ? t('admin.companies.edit') : t('admin.companies.new')}
        subtitle={t('group.company.note')}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setDrawer(null)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {t('common.save')}
            </button>
          </>
        }
      >
        <div className="fields" style={{ padding: 0 }}>
          {FORM_KEYS.map((key) => {
            const field = FIELD_INDEX[key]
            return (
              <FormField
                key={key}
                field={field}
                value={values[key.split('.')[1]]}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [key.split('.')[1]]: value }))
                }
                error={errors[key.split('.')[1]]}
              />
            )
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null)
          setForceInfo(null)
        }}
        onConfirm={() => confirmDelete(Boolean(forceInfo))}
        title={
          forceInfo
            ? t('admin.companies.deleteTitle', { name: deleteTarget?.name })
            : t('common.delete')
        }
        body={
          forceInfo
            ? `${t('admin.companies.deleteBody', {
                count: forceInfo.count,
              })} ${t('admin.companies.deleteEmpty')}`
            : `${deleteTarget?.name ?? ''} — ${t('admin.companies.deleteEmpty')}`
        }
        confirmLabel={forceInfo ? t('admin.companies.deleteAnyway') : t('common.delete')}
        busy={busy}
      />
    </div>
  )
}
