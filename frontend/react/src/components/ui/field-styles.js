// Shared input/select styling used by TextField and SelectField.
export function fieldClasses({ hasIcon, hasError, extraRight }) {
  return [
    'block w-full rounded-xl border bg-white py-2.5 text-[15px] text-slate-900 shadow-sm outline-none transition',
    'placeholder:text-slate-400 focus:ring-4',
    hasIcon ? 'pl-10' : 'pl-3.5',
    extraRight ? 'pr-11' : 'pr-3.5',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 hover:border-slate-300 focus:border-rose-400 focus:ring-rose-100',
  ].join(' ')
}
