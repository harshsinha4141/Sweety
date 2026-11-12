// White rounded panel used across the dashboard.
export default function Card({ title, subtitle, action, className = '', bodyClassName = '', children }) {
  return (
    <section className={`rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div>
            {title && <h2 className="font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
