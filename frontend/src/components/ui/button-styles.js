const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary:
    'bg-rose-600 text-white shadow-lg shadow-rose-600/25 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-rose-600/35 active:translate-y-0',
  secondary: 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  light: 'bg-white text-rose-700 shadow-lg shadow-rose-900/20 hover:-translate-y-0.5 hover:bg-rose-50',
  outlineLight: 'text-white ring-1 ring-white/40 hover:bg-white/10 hover:ring-white/60',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

// Shared by <Button> and by router <Link>s that should look like buttons.
export function buttonClasses({ variant = 'primary', size = 'md', full = false, className = '' } = {}) {
  return [base, variants[variant], sizes[size], full && 'w-full', className].filter(Boolean).join(' ')
}
