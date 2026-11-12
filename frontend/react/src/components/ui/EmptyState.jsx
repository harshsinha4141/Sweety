// Friendly placeholder for "no data" sections.
export default function EmptyState({ icon: Icon, title, text, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-12'}`}>
      {Icon && (
        <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="mt-3 font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
