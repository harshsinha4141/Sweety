import { ArrowDown, ArrowUp, Hash, Sigma } from 'lucide-react'
import EmptyState from '../ui/EmptyState'

const STATS = [
  { key: 'highest', label: 'Highest', icon: ArrowUp, unit: 'mg/dl' },
  { key: 'lowest', label: 'Lowest', icon: ArrowDown, unit: 'mg/dl' },
  { key: 'average', label: 'Average', icon: Sigma, unit: 'mg/dl' },
  { key: 'count', label: 'Readings', icon: Hash },
]

// One report (daily / month-to-date / monthly): range label + highest, lowest, average, count.
export default function ReportCard({
  title,
  report,
  icon: Icon,
  emptyIcon,
  accent = 'rose',
  emptyText = 'Log a reading and it will show up here.',
}) {
  const accents = {
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600',
  }

  return (
    <section className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
      <header className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${accents[accent]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="truncate text-sm text-slate-500">{report?.label ?? '…'}</p>
        </div>
      </header>

      {!report ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {STATS.map((s) => (
            <div key={s.key} className="h-[74px] animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : report.is_empty ? (
        <EmptyState compact icon={emptyIcon} title={report.empty_message} text={emptyText} />
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {STATS.map(({ key, label, icon: StatIcon, unit }) => (
            <div key={key} className="rounded-2xl bg-slate-50 px-3.5 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <StatIcon className="size-3.5" aria-hidden="true" /> {label}
              </dt>
              <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">
                {report.summary[key]}
                {unit && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
