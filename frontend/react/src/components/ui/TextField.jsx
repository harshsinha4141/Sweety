import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { fieldClasses } from './field-styles'
import FieldShell from './FieldShell'

// Text input with label, optional leading icon, inline error/hint and a show/hide toggle for passwords.
export default function TextField({ label, icon, type = 'text', error, hint, optional, className, ...props }) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <FieldShell id={id} label={label} icon={icon} error={error} hint={hint} optional={optional} className={className}>
      {(describedBy) => (
        <>
          <input
            id={id}
            type={isPassword && showPassword ? 'text' : type}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={fieldClasses({ hasIcon: Boolean(icon), hasError: Boolean(error), extraRight: isPassword })}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-rose-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          )}
        </>
      )}
    </FieldShell>
  )
}
