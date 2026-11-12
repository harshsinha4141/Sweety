import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { fieldClasses } from './field-styles'
import FieldShell from './FieldShell'

export default function SelectField({ label, icon, error, hint, optional, className, placeholder, options, ...props }) {
  const id = useId()

  return (
    <FieldShell id={id} label={label} icon={icon} error={error} hint={hint} optional={optional} className={className}>
      {(describedBy) => (
        <>
          <select
            id={id}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`${fieldClasses({ hasIcon: Boolean(icon), hasError: Boolean(error), extraRight: true })} appearance-none`}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </>
      )}
    </FieldShell>
  )
}
