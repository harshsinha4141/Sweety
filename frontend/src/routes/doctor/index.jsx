import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, CalendarCheck, ChevronRight, Search, UserRound, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, greeting } from '../../lib/dates'
import { ageFrom, genderLabel, initials, patientCode } from '../../lib/people'
import { useAsync } from '../../lib/useAsync'
import { doctorService } from '../../services/doctor'

export const Route = createFileRoute('/doctor/')({
  component: PatientsPage,
})

function PatientsPage() {
  const { user } = useAuth()
  const { data, error, loading } = useAsync(() => doctorService.patients(), 'patients')
  const [query, setQuery] = useState('')

  const patients = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = data?.patients ?? []
    return q
      ? list.filter((p) => `${p.full_name} ${p.email} ${patientCode(p.id)} ${p.id}`.toLowerCase().includes(q))
      : list
  }, [data, query])

  const totals = data?.totals
  const doctorName = user?.full_name?.split(' ').slice(0, 2).join(' ')

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-slate-500">
          {greeting()}
          {doctorName ? `, ${doctorName}` : ''}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My patients</h1>
        <p className="mt-1 text-slate-500">
          {data ? `Month-to-date: ${formatDate(data.from)} – ${formatDate(data.today)}` : 'Patients who chose you as their doctor.'}
        </p>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error.message}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Users} tone="bg-rose-50 text-rose-600" label="Patients" value={totals?.patients} />
        <StatTile
          icon={CalendarCheck}
          tone="bg-emerald-50 text-emerald-600"
          label="Logged a reading today"
          value={totals ? `${totals.logged_today} of ${totals.patients}` : undefined}
        />
        <StatTile
          icon={AlertTriangle}
          tone="bg-amber-50 text-amber-600"
          label="Out of range this month"
          value={totals?.out_of_range}
        />
      </div>

      <Card
        title="Patients"
        subtitle="Month-to-date. Open a patient to see their full daily, month-to-date and monthly reports."
        action={
          data?.patients?.length ? (
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">Search patients</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or ID"
                className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </label>
          ) : null
        }
        bodyClassName="pt-3!"
      >
        {!data && loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : !data?.patients?.length ? (
          <EmptyState
            icon={UserRound}
            title="No patients yet"
            text="Patients appear here when they choose you as their doctor while signing up or in their settings."
          />
        ) : !patients.length ? (
          <EmptyState compact icon={Search} title="No matching patients" text={`Nothing matches “${query}”.`} />
        ) : (
          <PatientTable patients={patients} today={data.today} perDay={data.readings_per_day} />
        )}
      </Card>
    </div>
  )
}

function StatTile({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        {value === undefined ? (
          <div className="mt-1 h-7 w-16 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
        )}
      </div>
    </div>
  )
}

// Month-to-date numbers and status for one patient row (same look as the landing-page preview).
const STATUS_PILL = {
  'On track': 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  Review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Missed readings': 'bg-slate-100 text-slate-600 ring-slate-500/15',
  'No readings': 'bg-slate-100 text-slate-500 ring-slate-500/15',
}
const IN_RANGE_TARGET = 70 // % of readings in range below which a patient needs review
const MIN_LOGGED_SHARE = 0.5 // logged under half the possible readings so far → missed readings

function patientStats(patient, today, perDay) {
  const m = patient.month_to_date
  const inRange = m.count ? Math.round(((m.count - m.high_count - m.low_count) / m.count) * 100) : null
  const possible = Number(today.slice(8, 10)) * perDay // days so far this month × readings per day
  let status = 'On track'
  if (!m.count) status = 'No readings'
  else if (inRange < IN_RANGE_TARGET) status = 'Review'
  else if (m.count < possible * MIN_LOGGED_SHARE) status = 'Missed readings'
  return { avg: m.average, inRange, status }
}

function patientSubline(patient) {
  const age = ageFrom(patient.date_of_birth)
  return [patientCode(patient.id), age !== null ? `${age} yrs` : null, genderLabel(patient.gender)]
    .filter(Boolean)
    .join(' · ')
}

const COLUMNS = 'grid grid-cols-[1fr_auto_auto] gap-x-4 sm:grid-cols-[1fr_auto_auto_auto_auto]'

function PatientTable({ patients, today, perDay }) {
  return (
    <div>
      <div
        className={`${COLUMNS} border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400`}
      >
        <span>Patient</span>
        <span className="text-right">Avg</span>
        <span className="text-right">In range</span>
        <span className="hidden text-right sm:block">Status</span>
        <span className="hidden sm:block" />
      </div>

      <ul className="divide-y divide-slate-100">
        {patients.map((p) => {
          const { avg, inRange, status } = patientStats(p, today, perDay)
          return (
            <li key={p.id}>
              <Link
                to="/doctor/patients/$patientId"
                params={{ patientId: String(p.id) }}
                aria-label={`Open full report for ${p.full_name}`}
                className={`${COLUMNS} group -mx-2 items-center rounded-xl px-2 py-3 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-rose-500`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-bold text-rose-700">
                    {initials(p.full_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{p.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{patientSubline(p)}</p>
                  </div>
                </div>

                <span className="text-right text-sm tabular-nums text-slate-700">
                  {avg ?? '—'} {avg !== null && <span className="text-slate-400">mg/dl</span>}
                </span>

                <div className="flex items-center justify-end gap-2">
                  {inRange === null ? (
                    <span className="w-9 text-right text-sm text-slate-400">—</span>
                  ) : (
                    <>
                      <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-100 sm:block">
                        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${inRange}%` }} />
                      </span>
                      <span className="w-9 text-right text-sm font-semibold tabular-nums text-slate-800">{inRange}%</span>
                    </>
                  )}
                </div>

                <span
                  className={`hidden justify-self-end rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 sm:inline-block ${STATUS_PILL[status]}`}
                >
                  {status}
                </span>

                <ChevronRight
                  className="hidden size-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block"
                  aria-hidden="true"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
