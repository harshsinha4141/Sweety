import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, ArrowUp, BellRing, CalendarRange, Clock, Pencil, Plus, Sigma, Trash2 } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import MonthChart from '../../components/charts/MonthChart'
import { useDashboard } from '../../components/dashboard/dashboard-context'
import StatusBadge from '../../components/readings/StatusBadge'
import Card from '../../components/ui/Card'
import { formatClock, formatDateLong, formatMonth, formatTime, greeting } from '../../lib/dates'
import { MAX_READINGS_PER_DAY, SLOTS } from '../../lib/glucose'
import { useAsync } from '../../lib/useAsync'
import { reportsService } from '../../services/reports'

export const Route = createFileRoute('/dashboard/')({
  component: OverviewPage,
})

function OverviewPage() {
  const { user } = useAuth()
  const { today, now, version, todayReport, todayError, openAdd, reminders, reminderSettings } = useDashboard()
  const summary = todayReport?.summary
  const count = summary?.count ?? 0
  const firstName = user?.full_name?.trim().split(/\s+/)[0]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{formatDateLong(today)}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''} 👋
          </h1>
        </div>
        <Link
          to="/dashboard/reports"
          className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
        >
          View reports <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {todayError && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{todayError.message}</p>
      )}

      {/* Today at a glance */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ProgressTile count={count} loading={!todayReport} />
        <StatTile label="Average today" icon={Sigma} value={summary?.average} loading={!todayReport} />
        <StatTile label="Highest today" icon={ArrowUp} value={summary?.highest} loading={!todayReport} />
        <StatTile label="Lowest today" icon={ArrowDown} value={summary?.lowest} loading={!todayReport} />
      </div>

      {/* Today's slots */}
      <Card
        title="Today's readings"
        subtitle={
          count >= MAX_READINGS_PER_DAY
            ? 'All 4 readings logged today — great job!'
            : `${MAX_READINGS_PER_DAY - count} of ${MAX_READINGS_PER_DAY} slots left today`
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SLOTS.map((slot) => {
            const entry = todayReport?.readings?.find((r) => r.time_slot === slot.value)
            const due = reminders.due.find((d) => d.slot === slot.value)
            return (
              <SlotCard
                key={slot.value}
                slot={slot}
                reading={entry}
                loading={!todayReport}
                due={due}
                reminderTime={reminderSettings.enabled && reminderSettings.slots[slot.value].enabled ? reminderSettings.slots[slot.value].time : null}
                onAdd={() => openAdd({ reading_date: today, time_slot: slot.value })}
              />
            )
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="This month"
          subtitle={`Readings over ${formatMonth(today.slice(0, 7))}`}
        >
          <MonthChart month={today.slice(0, 7)} upTo={today} version={version} height={260} />
        </Card>

        <div className="space-y-6">
          <RemindersCard />
          <MonthSummaryCard today={today} version={version} />
        </div>
      </div>
    </div>
  )
}

function ProgressTile({ count, loading }) {
  const pct = Math.min(1, count / MAX_READINGS_PER_DAY)
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-linear-to-br from-rose-500 to-pink-600 p-4 text-white shadow-lg shadow-rose-600/20 sm:p-5">
      <svg viewBox="0 0 56 56" className="size-14 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div>
        <p className="text-xs font-medium text-rose-100">Logged today</p>
        <p className="text-2xl font-extrabold tabular-nums">
          {loading ? '–' : count}
          <span className="text-base font-semibold text-rose-100">/{MAX_READINGS_PER_DAY}</span>
        </p>
      </div>
    </div>
  )
}

function StatTile({ label, icon: Icon, value, loading }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="size-3.5" aria-hidden="true" /> {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-slate-900">
          {value ?? <span className="text-slate-300">—</span>}
          {value != null && <span className="ml-1 text-xs font-medium text-slate-400">mg/dl</span>}
        </p>
      )}
    </div>
  )
}

function SlotCard({ slot, reading, loading, due, reminderTime, onAdd }) {
  const { openEdit, requestDelete } = useDashboard()
  const Icon = slot.icon

  if (loading) return <div className="h-[132px] animate-pulse rounded-2xl bg-slate-100" />

  if (reading) {
    return (
      <div className="group relative rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span
              className="grid size-8 place-items-center rounded-lg"
              style={{ background: `${slot.color}14`, color: slot.color }}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            {slot.label}
          </span>
        </div>
        <p className="mt-3 text-3xl font-extrabold tabular-nums text-slate-900">
          {reading.glucose_value}
          <span className="ml-1 text-sm font-medium text-slate-400">mg/dl</span>
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusBadge status={reading.status} />
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="size-3" aria-hidden="true" /> {formatTime(reading.created_at)}
          </span>
        </div>
        <div className="absolute right-2 top-2 flex gap-0.5 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => openEdit(reading)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Edit ${slot.label} reading`}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => requestDelete(reading)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${slot.label} reading`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className={`flex min-h-[132px] flex-col items-start justify-between rounded-2xl border-2 border-dashed p-4 text-left transition hover:border-rose-300 hover:bg-rose-50/40 focus-visible:outline-2 focus-visible:outline-rose-500 ${
        due ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {slot.label}
      </span>
      <span className="text-sm text-slate-500">
        {due ? (
          <span className="font-medium text-amber-700">Due since {formatClock(due.time)}</span>
        ) : reminderTime ? (
          `Reminder at ${formatClock(reminderTime)}`
        ) : (
          'Not logged yet'
        )}
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600">
        <Plus className="size-4" aria-hidden="true" /> Add reading
      </span>
    </button>
  )
}

function RemindersCard() {
  const { reminders, reminderSettings, openAdd, today } = useDashboard()
  const next = reminders.upcoming[0]

  return (
    <Card
      title="Reminders"
      action={
        <Link to="/dashboard/reminders" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
          Edit times
        </Link>
      }
      bodyClassName="pt-4!"
    >
      {!reminderSettings.enabled ? (
        <p className="text-sm text-slate-500">Reminders are off. Turn them on to get a nudge at reading time.</p>
      ) : reminders.due.length ? (
        <ul className="space-y-2">
          {reminders.due.map((d) => (
            <li key={d.slot} className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <BellRing className="size-4" aria-hidden="true" /> {d.label}
              </span>
              <button
                type="button"
                onClick={() => openAdd({ reading_date: today, time_slot: d.slot })}
                className="text-xs font-semibold text-amber-800 underline-offset-2 hover:underline"
              >
                Log now
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">
          {next ? (
            <>
              Next reading: <span className="font-semibold text-slate-900">{next.label}</span> at{' '}
              <span className="font-semibold text-slate-900">{formatClock(next.time)}</span>
            </>
          ) : (
            'Nothing left for today. 🎉'
          )}
        </p>
      )}
    </Card>
  )
}

function MonthSummaryCard({ today, version }) {
  const { data } = useAsync(() => reportsService.all(today), `${today}:${version}`)
  const rows = [
    { key: 'month_to_date', title: 'This month so far' },
    { key: 'monthly', title: 'Last month' },
  ]
  return (
    <Card
      title="Monthly summary"
      action={<CalendarRange className="size-5 text-slate-300" aria-hidden="true" />}
      bodyClassName="pt-4! space-y-3"
    >
      {rows.map(({ key, title }) => {
        const report = data?.[key]
        return (
          <div key={key} className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="truncate text-xs text-slate-500">{report?.label}</p>
            </div>
            {!report ? (
              <div className="mt-2 h-5 animate-pulse rounded bg-slate-200/70" />
            ) : report.is_empty ? (
              <p className="mt-1 text-sm text-slate-500">{report.empty_message}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                Avg <span className="font-bold text-slate-900">{report.summary.average}</span> · High{' '}
                <span className="font-bold text-slate-900">{report.summary.highest}</span> · Low{' '}
                <span className="font-bold text-slate-900">{report.summary.lowest}</span> ·{' '}
                {report.summary.count} readings
              </p>
            )}
          </div>
        )
      })}
    </Card>
  )
}
