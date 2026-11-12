import { ChartLine, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { daysInMonth, formatMonth, MONTH_NAMES } from '../../lib/dates'
import { SLOTS, TARGET_HIGH, TARGET_LOW } from '../../lib/glucose'
import { useAsync } from '../../lib/useAsync'
import { readingsService } from '../../services/readings'
import EmptyState from '../ui/EmptyState'

const AVG_COLOR = '#475569' // slate-600: the daily average is a neutral reference line, not a category
const MAX_PER_MONTH = 31 * 4

const SERIES = [
  ...SLOTS.map((slot) => ({ key: `s${slot.value}`, label: slot.label, color: slot.color })),
  { key: 'avg', label: 'Daily average', color: AVG_COLOR, dashed: true },
]

// Line chart of every reading in `month` (YYYY-MM), up to `upTo` (YYYY-MM-DD) if given.
// One line per time slot + the daily average, with the 70–180 mg/dl target band shaded.
export default function MonthChart({ month, upTo, version = 0, height = 300 }) {
  const lastDay = upTo && upTo.startsWith(month) ? Number(upTo.slice(8, 10)) : daysInMonth(month)
  const to = `${month}-${String(lastDay).padStart(2, '0')}`
  const [hidden, setHidden] = useState(() => new Set())
  const [view, setView] = useState('chart')

  const { data, loading, error } = useAsync(
    () => readingsService.list({ from: `${month}-01`, to, limit: MAX_PER_MONTH }),
    `${month}:${to}:${version}`,
  )

  const rows = useMemo(() => {
    const readings = data?.readings ?? []
    const [, m] = month.split('-').map(Number)
    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1
      const date = `${month}-${String(day).padStart(2, '0')}`
      const dayReadings = readings.filter((r) => r.reading_date === date)
      const row = { day, date, label: `${day} ${MONTH_NAMES[m - 1]}` }
      for (const r of dayReadings) row[`s${r.time_slot}`] = r.glucose_value
      if (dayReadings.length) {
        row.avg = Math.round((dayReadings.reduce((a, r) => a + r.glucose_value, 0) / dayReadings.length) * 10) / 10
      }
      return row
    })
  }, [data, month, lastDay])

  const total = data?.readings?.length ?? 0

  const toggle = (key) =>
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  if (error) return <p className="py-10 text-center text-sm text-red-600">{error.message}</p>
  if (!data && loading) return <div className="animate-pulse rounded-2xl bg-slate-100" style={{ height }} />

  if (!total) {
    return (
      <EmptyState
        icon={ChartLine}
        title={`No readings in ${formatMonth(month)} yet`}
        text="Your chart will appear here once you log a reading."
      />
    )
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* Legend (click to show / hide a line) + chart/table switch */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Chart series">
          {SERIES.map((s) => {
            const off = hidden.has(s.key)
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => toggle(s.key)}
                  aria-pressed={!off}
                  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                    off ? 'text-slate-400 ring-slate-200' : 'text-slate-700 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s.dashed ? (
                    <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: off ? '#cbd5e1' : s.color }} />
                  ) : (
                    <span className="size-2.5 rounded-full" style={{ background: off ? '#cbd5e1' : s.color }} />
                  )}
                  {s.label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold" role="group" aria-label="View">
          {[
            { id: 'chart', icon: ChartLine, label: 'Chart' },
            { id: 'table', icon: Table2, label: 'Table' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                view === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        <div style={{ height }} role="img" aria-label={`Line chart of ${total} glucose readings in ${formatMonth(month)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <ReferenceArea y1={TARGET_LOW} y2={TARGET_HIGH} fill="#10b981" fillOpacity={0.06} ifOverflow="extendDomain" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                domain={[(min) => Math.max(0, Math.min(60, Math.floor((min - 10) / 10) * 10)), (max) => Math.max(200, Math.ceil((max + 10) / 10) * 10)]}
                allowDecimals={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '5 4' : undefined}
                  dot={s.dashed ? false : { r: 4, strokeWidth: 2, stroke: '#fff', fill: s.color }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  connectNulls
                  hide={hidden.has(s.key)}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <MonthTable rows={rows.filter((r) => r.avg !== undefined)} />
      )}
      <p className="mt-3 text-xs text-slate-500">
        Shaded band: {TARGET_LOW}–{TARGET_HIGH} mg/dl target range · {total} reading{total === 1 ? '' : 's'}
      </p>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const items = payload.filter((p) => p.value !== undefined && p.value !== null)
  if (!items.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-lg shadow-slate-900/10">
      <p className="mb-1.5 font-semibold text-slate-900">{row.label ?? label}</p>
      <ul className="space-y-1">
        {items.map((p) => (
          <li key={p.dataKey} className="flex items-center gap-2 text-slate-600">
            <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            <span className="flex-1">{p.name}</span>
            <span className="font-semibold tabular-nums text-slate-900">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Accessible table view of the same data (days with readings only).
function MonthTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5">Date</th>
            {SLOTS.map((s) => (
              <th key={s.value} className="px-3 py-2.5 text-right">
                {s.short}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right">Avg</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.date}>
              <td className="px-3 py-2 font-medium text-slate-700">{r.label}</td>
              {SLOTS.map((s) => (
                <td key={s.value} className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {r[`s${s.value}`] ?? <span className="text-slate-300">—</span>}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{r.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
