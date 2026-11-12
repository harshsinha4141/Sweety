import { LoaderCircle } from 'lucide-react'
import { buttonClasses } from './button-styles'

export default function Button({
  variant,
  size,
  full,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, full, className })}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
