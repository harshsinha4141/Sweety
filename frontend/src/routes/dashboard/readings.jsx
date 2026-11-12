import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, ChevronRight, Droplet, Pencil, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '../../components/dashboard/dashboard-context'
import StatusBadge from '../../components/readings/StatusBadge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import TextField from '../../components/ui/TextField'
import { formatDate, formatDateShort, formatTime } from '../../lib/dates'
import { SLOTS } from '../../lib/glucose'
import { useAsync } from '../../lib/useAsync'
import { readingsService } from '../../services/readings'

const LIMITS = [10, 20, 50]
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const Route = createFileRoute('/dashboard/readings')({
  validateSearch: (search) => {
    const page = Number(search.page)
    const limit = Number(search.limit)
    return {
      page: Number.isInteger(page) && page > 0 ? page : 1,
      limit: LIMITS.includes(limit) ? limit : 20,
      from: DATE_RE.test(search.from ?? '') ? search.from : undefined,
      to: DATE_RE.test(search.to ?? '') ? search.to : undefined,
    }
  },
  component: ReadingsPage,
})

function ReadingsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { version, openAdd, openEdit, requestDelete, today } = useDashboard()

  const { page, limit, from, to } = search
  const { data, loading, error } = useAsync(
    () => readingsService.list({ page, limit, from, to }),
    `${page}:${limit}:${from}:${to}:${version}`,
  )

  const setSearch = (changes) => navigate({ search: (prev) => ({ ...prev, ...changes }) })
  const pagination = data?.pagination
  const readings = data?.readings ?? []
  const filtered = Boolean(from)

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Readings</h1>
          <p className="mt-1 text-slate-500">Every reading you&apos;ve logged, newest first.</p>
        </div>
        <Button onClick={() => openAdd()}>
          <Plus className="size-4" aria-hidden="true" /> Add reading
        </Button>
      </div>

      <FilterBar
        key={`${from}:${to}`}
        from={from}
        to={to}
        today={today}
        onApply={(range) => setSearch({ ...range, page: 1 })}
        onClear={() => setSearch({ from: undefined, to: undefined, page: 1 })}
      />

      <Card bodyClassName="p-0! sm:p-0!">
        {error ? (
          <p className="px-6 py-10 text-center text-sm text-red-600">{error.message}</p>
        ) : !data && loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !readings.length ? (
          <EmptyState
            icon={Droplet}
            title={filtered ? 'No readings in this date range' : 'No readings yet'}
            text={filtered ? 'Try a different range or clear the filter.' : 'Log your first reading to start building your history.'}
            action={
              filtered ? (
                <Button variant="secondary" size="sm" onClick={() => setSearch({ from: undefined, to: undefined, page: 1 })}>
                  Clear filter
                </Button>
              ) : (
                <Button size="sm" onClick={() => openAdd()}>
                  <Plus className="size-4" aria-hidden="true" /> Add reading
                </Button>
              )
            }
          />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* Table on larger screens */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-3 py-3.5">Time slot</th>
                  <th className="px-3 py-3.5 text-right">Value</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Logged at</th>
                  <th className="px-6 py-3.5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r) => {
                  const slot = SLOTS[r.time_slot]
                  const Icon = slot.icon
                  return (
                    <tr key={r.id} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-6 py-3.5 font-medium text-slate-800">{formatDateShort(r.reading_date)}</td>
                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-2 text-slate-700">
                          <span
                            className="grid size-7 place-items-center rounded-lg"
                            style={{ background: `${slot.color}14`, color: slot.color }}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          {slot.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold tabular-nums text-slate-900">
                        {r.glucose_value} <span className="text-xs font-medium text-slate-400">mg/dl</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-slate-500">{formatTime(r.created_at)}</td>
                      <td className="px-6 py-3.5">
                        <RowActions reading={r} onEdit={openEdit} onDelete={requestDelete} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Cards on phones */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {readings.map((r) => {
                const slot = SLOTS[r.time_slot]
                const Icon = slot.icon
                return (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: `${slot.color}14`, color: slot.color }}
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{slot.label}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(r.reading_date)} · {formatTime(r.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold tabular-nums text-slate-900">{r.glucose_value}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <RowActions reading={r} onEdit={openEdit} onDelete={requestDelete} />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {pagination && pagination.total > 0 && (
          <Pager
            pagination={pagination}
            onPage={(p) => setSearch({ page: p })}
            onLimit={(l) => setSearch({ limit: l, page: 1 })}
          />
        )}
      </Card>
    </div>
  )
}

function RowActions({ reading, onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-0.5">
      <button
        type="button"
        onClick={() => onEdit(reading)}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Edit reading"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(reading)}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="Delete reading"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

function FilterBar({ from, to, today, onApply, onClear }) {
  const [range, setRange] = useState({ from: from ?? '', to: to ?? '' })
  const [error, setError] = useState('')

  function apply(event) {
    event.preventDefault()
    // One date filled = that single day.
    const start = range.from || range.to
    const end = range.to || range.from
    if (!start) return setError('Pick a date or a range.')
    if (start > end) return setError('"From" must be on or before "To".')
    setError('')
    onApply({ from: start, to: end })
  }

  return (
    <form onSubmit={apply} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          label="From"
          type="date"
          icon={CalendarDays}
          max={today}
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          className="min-w-40 flex-1"
        />
        <TextField
          label="To"
          type="date"
          icon={CalendarDays}
          max={today}
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          className="min-w-40 flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            <SlidersHorizontal className="size-4" aria-hidden="true" /> Filter
          </Button>
          {from && (
            <Button variant="ghost" onClick={onClear}>
              <X className="size-4" aria-hidden="true" /> Clear
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      {from && (
        <p className="mt-3 text-xs text-slate-500">
          Showing {from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`}
        </p>
      )}
    </form>
  )
}

function Pager({ pagination, onPage, onLimit }) {
  const { page, limit, total, total_pages: pages } = pagination
  const start = Math.min(total, (page - 1) * limit + 1)
  const end = Math.min(total, page * limit)

  // Compact page list: 1 … 4 5 6 … 12
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const items = []
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) items.push(`gap-${n}`)
    items.push(n)
  })

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row sm:px-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          {page > pages ? `Page ${page} is empty · ${total} total` : `${start}–${end} of ${total}`}
        </span>
        <label className="flex items-center gap-1.5">
          <span className="sr-only sm:not-sr-only">Per page</span>
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          >
            {LIMITS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <PageButton disabled={page <= 1} onClick={() => onPage(Math.min(page - 1, pages))} label="Previous page">
          <ChevronLeft className="size-4" />
        </PageButton>
        {items.map((item) =>
          typeof item === 'string' ? (
            <span key={item} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <PageButton key={item} active={item === page} onClick={() => onPage(item)} label={`Page ${item}`}>
              {item}
            </PageButton>
          ),
        )}
        <PageButton disabled={page >= pages} onClick={() => onPage(page + 1)} label="Next page">
          <ChevronRight className="size-4" />
        </PageButton>
      </nav>
    </div>
  )
}

function PageButton({ children, active, disabled, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}
