/**
 * T4.1 — Form controls for the posting form.
 *
 * T4.2 — the `error` prop and `.field__error` message are the validation hook.
 * `src/components/Field.jsx` is a re-export shim for existing imports.
 */
import { useI18n } from '../src/i18n/index.jsx'
import { Icon } from '../src/components/Icon.jsx'

/**
 * A coded value rendered as a segmented control. The stored number is shown on
 * every option, so the reader can always map the interface back to the code in
 * the lab document.
 */
export function Segmented({ options, value, onChange, disabled, label }) {
  const { t } = useI18n()
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="segmented__opt"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          <span className="segmented__code">{option.value}</span>
          <span>{option.literal ? option.label : t(option.label)}</span>
        </button>
      ))}
    </div>
  )
}

export function FieldControl({ field, value, onChange, invalid, disabled, id }) {
  const { t } = useI18n()
  const label = t(field.label)

  if (field.type === 'coded') {
    return (
      <Segmented
        options={field.options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        label={label}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <select
        id={id}
        className="select"
        value={value ?? ''}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      >
        {field.options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.literal ? option.label : t(option.label)}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        id={id}
        className="textarea"
        value={value ?? ''}
        placeholder={field.placeholder ? t(field.placeholder) : undefined}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        maxLength={field.maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (field.type === 'number') {
    return (
      <input
        id={id}
        className="input input--mono"
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        min={field.min}
        max={field.max}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(event) =>
          onChange(event.target.value === '' ? '' : Number(event.target.value))
        }
      />
    )
  }

  return (
    <input
      id={id}
      className={`input${field.type === 'date' ? ' input--mono' : ''}`}
      type={field.type === 'date' ? 'date' : 'text'}
      value={value ?? ''}
      placeholder={field.placeholder ? t(field.placeholder) : undefined}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      maxLength={field.maxLength}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function FormField({ field, value, onChange, error, disabled, className }) {
  const { t } = useI18n()
  const id = `f-${field.key.replace(/\./g, '-')}`
  const isSegmented = field.type === 'coded'

  return (
    <div
      id={`field-${field.key.replace(/\./g, '-')}`}
      className={`field${field.wide ? ' field--wide' : ''}${className ? ` ${className}` : ''}`}
    >
      {isSegmented ? (
        <span className="field__label">
          {t(field.label)}
          {field.required ? <span className="field__req">*</span> : null}
        </span>
      ) : (
        <label className="field__label" htmlFor={id}>
          {t(field.label)}
          {field.required ? <span className="field__req">*</span> : null}
        </label>
      )}

      <FieldControl
        id={id}
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled || field.readOnly}
        invalid={Boolean(error)}
      />

      {field.help ? <span className="field__help">{t(field.help)}</span> : null}
      {/* T4.2 — the validation message is attached to the exact input. */}
      {error ? (
        <span className="field__error">
          <Icon name="alert" size={11} strokeWidth={2} />
          {t(error)}
        </span>
      ) : null}
    </div>
  )
}
