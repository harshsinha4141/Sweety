import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarCheck, CalendarDays, CalendarRange, ClipboardList, History, Plus } from 'lucide-react'
import { useState } from 'react'
import MonthChart from '../../components/charts/MonthChart'
import { useDashboard } from '../../components/dashboard/dashboard-context'
import ReadingRow from '../../components/readings/ReadingRow'
import HardResetButton from '../../components/reports/HardResetButton'
import ReportCard from '../../components/reports/ReportCard'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import TextField from '../../components/ui/TextField'
import { formatDate, formatMonth, previousMonth } from '../../lib/dates'
import { currentSlot, isReadingEditable } from '../../lib/glucose'
import { useAsync } from '../../lib/useAsync'
import { reportsService } from '../../services/reports'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const Route = createFileRoute('/dashboard/reports')({
  validateSearch: (search) => ({ date: DATE_RE.test(search.date ?? '') ? search.date : undefined }),
  component: ReportsPage,
})

function ReportsPage() {
  const { date: searchDate } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { today, now, version, refresh, openAdd, openEdit, requestDelete } = useDashboard()
  const date = searchDate && searchDate <= today ? searchDate : today

  const { data, error, loading } = useAsync(() => reportsService.all(date), `${date}:${version}`)
  const reports = data?.date === date ? data : null

  const setDate = (value) => navigate({ search: { date: value === today ? undefined : value } })

  const selectedMonth = date.slice(0, 7)
  const [chartMonth, setChartMonth] = useState('selected')
  const month = chartMonth === 'selected' ? selectedMonth : previousMonth(selectedMonth)

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Reports</h1>
          <p className="mt-1 text-slate-500">Highest, lowest and average readings for the selected date.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <TextField
            label="Selected date"
            type="date"
            icon={CalendarDays}
            max={today}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value > today ? today : e.target.value)}
          />
          {date !== today && (
            <Button variant="secondary" onClick={() => setDate(today)}>
              Today
            </Button>
          )}
          <HardResetButton onReset={reportsService.resetCache} onDone={refresh} />
        </div>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error.message}</p>}

      <div className={`grid gap-4 md:grid-cols-3 ${loading && reports ? 'opacity-60' : ''}`}>
        <ReportCard title="Daily" icon={CalendarCheck} emptyIcon={ClipboardList} report={reports?.daily} accent="rose" />
        <ReportCard
          title="Month-to-date"
          icon={CalendarRange}
          emptyIcon={CalendarRange}
          report={reports?.month_to_date}
          accent="violet"
        />
        <ReportCard title="Monthly" icon={History} emptyIcon={History} report={reports?.monthly} accent="sky" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          className="lg:col-span-2"
          title="Daily readings"
          subtitle={formatDate(date)}
          action={
            // Only today's open slot can be logged (missed slots can't be filled in later).
            date === today && currentSlot(now) !== null ? (
              <Button size="sm" variant="secondary" onClick={() => openAdd()}>
                <Plus className="size-4" aria-hidden="true" /> Add
              </Button>
            ) : null
          }
          bodyClassName="pt-2!"
        >
          {!reports ? (
            <div className="space-y-3 pt-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : reports.daily.is_empty ? (
            <EmptyState
              compact
              icon={ClipboardList}
              title={reports.daily.empty_message}
              text="Readings you log for this date will be listed here with their slot."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {reports.daily.readings.map((r) => (
                <ReadingRow
                  key={r.id}
                  reading={r}
                  onEdit={isReadingEditable(r, now) ? openEdit : undefined}
                  onDelete={isReadingEditable(r, now) ? requestDelete : undefined}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card
          className="lg:col-span-3"
          title="Readings over the month"
          subtitle={
            chartMonth === 'selected'
              ? `${formatMonth(month)} · up to ${formatDate(date)}`
              : `${formatMonth(month)} · whole month`
          }
          action={
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold" role="group" aria-label="Month">
              {[
                { id: 'selected', label: 'This month' },
                { id: 'previous', label: 'Previous month' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={chartMonth === id}
                  onClick={() => setChartMonth(id)}
                  className={`rounded-md px-2.5 py-1 transition ${
                    chartMonth === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <MonthChart month={month} upTo={chartMonth === 'selected' ? date : undefined} version={version} />
        </Card>
      </div>
    </div>
  )
}
