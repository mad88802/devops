import { useState } from 'react'
import { RECRUITER_ROLES } from '../../../shared/fields.js'
import { api } from '../../api/client.js'
import { DataTable } from '../../components/DataTable.jsx'
import { FormField } from '../../components/Field.jsx'
import { Icon } from '../../components/Icon.jsx'
import { ConfirmDialog, Modal } from '../../components/Modal.jsx'
import { Empty } from '../../components/Small.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { initials } from '../../lib/format.js'
import { useAsync } from '../../lib/useAsync.js'

const FIELDS = {
  'recruiter.name': { key: 'recruiter.name', label: 'common.name', type: 'text', required: true, maxLength: 100 },
  'recruiter.surname': {
    key: 'recruiter.surname',
    label: 'common.surname',
    type: 'text',
    required: true,
    maxLength: 100,
  },
  'recruiter.email': { key: 'recruiter.email', label: 'common.email', type: 'text', required: true },
  'recruiter.role': {
    key: 'recruiter.role',
    label: 'common.role',
    type: 'coded',
    required: true,
    options: RECRUITER_ROLES,
  },
}

const EMPTY = { name: '', surname: '', email: '', role: 'R' }

export function Recruiters() {
  const { t } = useI18n()
  const { push } = useToast()

  const [drawer, setDrawer] = useState(null)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const list = useAsync(() => api.recruiters.list(), [])

  function openCreate() {
    setValues(EMPTY)
    setErrors({})
    setDrawer({ mode: 'create' })
  }

  function openEdit(recruiter) {
    setValues({
      name: recruiter.name,
      surname: recruiter.surname,
      email: recruiter.email,
      role: recruiter.role,
    })
    setErrors({})
    setDrawer({ mode: 'edit', recruiter })
  }

  async function save() {
    setSaving(true)
    try {
      if (drawer.mode === 'create') await api.recruiters.create(values)
      else await api.recruiters.update(drawer.recruiter.id, values)
      push({ tone: 'success', title: t('admin.recruiters.saved') })
      setDrawer(null)
      list.reload()
    } catch (error) {
      if (error.fields) setErrors(error.fields)
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await api.recruiters.remove(deleteTarget.id)
      push({ tone: 'success', title: t('admin.recruiters.deleted') })
      setDeleteTarget(null)
      list.reload()
    } catch (error) {
      push({ tone: 'error', title: t('toast.error'), body: t(error.key ?? 'error.server') })
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('common.name'),
      render: (recruiter) => (
        <div className="person">
          <span className="mini-avatar">{initials(recruiter.name, recruiter.surname)}</span>
          <span style={{ minWidth: 0 }}>
            <span className="person__name">
              {recruiter.name} {recruiter.surname}
            </span>
            <span className="person__mail">{recruiter.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('common.role'),
      render: (recruiter) => (
        <span className="row" style={{ gap: 7 }}>
          <span className="roletag">{recruiter.role}</span>
          <span className="small muted">{t(`role.${recruiter.role}`)}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (recruiter) => (
        <span className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="icon-btn icon-btn--ink"
            title={t('common.edit')}
            aria-label={t('common.edit')}
            onClick={() => openEdit(recruiter)}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--ink"
            title={t('common.delete')}
            aria-label={t('common.delete')}
            onClick={() => setDeleteTarget(recruiter)}
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
          <h1>{t('admin.recruiters.title')}</h1>
          <p>{t('admin.recruiters.sub')}</p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Icon name="plus" size={14} />
            {t('admin.recruiters.add')}
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          rows={list.data?.items ?? []}
          loading={list.status === 'loading'}
          empty={<Empty icon="users" title={t('admin.recruiters.title')} />}
        />
      </div>

      <Modal
        open={Boolean(drawer)}
        onClose={() => setDrawer(null)}
        drawer
        title={drawer?.mode === 'edit' ? t('admin.recruiters.edit') : t('admin.recruiters.add')}
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
        <div className="stack">
          <FormField
            field={FIELDS['recruiter.name']}
            value={values.name}
            onChange={(value) => setValues((current) => ({ ...current, name: value }))}
            error={errors['recruiter.name']}
          />
          <FormField
            field={FIELDS['recruiter.surname']}
            value={values.surname}
            onChange={(value) => setValues((current) => ({ ...current, surname: value }))}
            error={errors['recruiter.surname']}
          />
          <FormField
            field={FIELDS['recruiter.email']}
            value={values.email}
            onChange={(value) => setValues((current) => ({ ...current, email: value }))}
            error={errors['recruiter.email']}
          />
          <FormField
            field={FIELDS['recruiter.role']}
            value={values.role}
            onChange={(value) => setValues((current) => ({ ...current, role: value }))}
            error={errors['recruiter.role']}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('admin.recruiters.deleteTitle', {
          name: deleteTarget ? `${deleteTarget.name} ${deleteTarget.surname}` : '',
        })}
        body={t('admin.recruiters.deleteBody')}
        confirmLabel={t('common.delete')}
        busy={busy}
      />
    </div>
  )
}
