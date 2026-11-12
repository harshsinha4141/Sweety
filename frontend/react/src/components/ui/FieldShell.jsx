import { CircleAlert } from 'lucide-react'

// Label + icon + error/hint wrapper shared by TextField and SelectField.
export default function FieldShell({ id, label, icon: Icon, error, hint, optional, className = '', children }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-slate-400">Optional</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        {children(describedBy)}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <CircleAlert className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
