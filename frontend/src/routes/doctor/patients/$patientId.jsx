import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Droplet,
  History,
  Mail,
  Phone,
  Ruler,
  UserRound,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import MonthChart from '../../../components/charts/MonthChart'
import ReadingRow from '../../../components/readings/ReadingRow'
import ReportCard from '../../../components/reports/ReportCard'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import TextField from '../../../components/ui/TextField'
import { formatDate, formatMonth, previousMonth, todayISO } from '../../../lib/dates'
import { ageFrom, genderLabel, initials, patientCode } from '../../../lib/people'
import { useAsync } from '../../../lib/useAsync'
import { doctorService } from '../../../services/doctor'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const Route = createFileRoute('/doctor/patients/$patientId')({
  validateSearch: (search) => ({ date: DATE_RE.test(search.date ?? '') ? search.date : undefined }),
  component: PatientReportsPage,
})

const EMPTY_FOR_DOCTOR = 'The patient hasn’t logged readings for this period.'

function PatientReportsPage() {
  const { patientId } = Route.useParams()
  const { date: searchDate } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const today = todayISO()
  const date = searchDate && searchDate <= today ? searchDate : today

  const profile = useAsync(() => doctorService.patient(patientId), `patient:${patientId}`)
  const reportsState = useAsync(() => doctorService.reports(patientId, date), `${patientId}:${date}`)
  const reports = reportsState.data?.date === date ? reportsState.data : null

  const setDate = (value) => navigate({ search: { date: value === today ? undefined : value } })

  const selectedMonth = date.slice(0, 7)
  const [chartMonth, setChartMonth] = useState('selected')
  const month = chartMonth === 'selected' ? selectedMonth : previousMonth(selectedMonth)
  const fetchReadings = useCallback((params) => doctorService.readings(patientId, params), [patientId])

  // Not assigned to this doctor (or doesn't exist): the API answers 404 for both.
  if (profile.error?.status === 404) {
    return (
      <Card>
        <EmptyState
          icon={UserRound}
          title="Patient not found"
          text="This patient isn’t assigned to you, or the link is wrong."
          action={
            <Link to="/doctor" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              Back to my patients
            </Link>
          }
        />
      </Card>
    )
  }

  const patient = profile.data?.patient

  return (
    <div className="space-y-6 animate-fade-up">
      <Link
        to="/doctor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All patients
      </Link>

      <PatientHeader patient={patient} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            {patient ? `Reports for ${patient.full_name}` : 'Reports'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Highest, lowest and average readings for the selected date.</p>
        </div>
        <div className="flex items-end gap-2">
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
        </div>
      </div>

      {reportsState.error && reportsState.error.status !== 404 && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {reportsState.error.message}
        </p>
      )}

      <div className={`grid gap-4 md:grid-cols-3 ${reportsState.loading && reports ? 'opacity-60' : ''}`}>
        <ReportCard title="Daily" icon={CalendarCheck} emptyIcon={ClipboardList} report={reports?.daily} accent="rose" emptyText={EMPTY_FOR_DOCTOR} />
        <ReportCard
          title="Month-to-date"
          icon={CalendarRange}
          emptyIcon={CalendarRange}
          report={reports?.month_to_date}
          accent="violet"
          emptyText={EMPTY_FOR_DOCTOR}
        />
        <ReportCard title="Monthly" icon={History} emptyIcon={History} report={reports?.monthly} accent="sky" emptyText={EMPTY_FOR_DOCTOR} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" title="Daily readings" subtitle={formatDate(date)} bodyClassName="pt-2!">
          {!reports ? (
            <div className="space-y-3 pt-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : reports.daily.is_empty ? (
            <EmptyState compact icon={ClipboardList} title={reports.daily.empty_message} text={EMPTY_FOR_DOCTOR} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {reports.daily.readings.map((r) => (
                <ReadingRow key={r.id} reading={r} />
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
          <MonthChart
            key={patientId}
            month={month}
            upTo={chartMonth === 'selected' ? date : undefined}
            fetchReadings={fetchReadings}
            emptyText="The chart appears once the patient logs readings this month."
          />
        </Card>
      </div>
    </div>
  )
}

function PatientHeader({ patient }) {
  if (!patient) {
    return (
      <div className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5">
        <div className="size-14 animate-pulse rounded-full bg-slate-100" />
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    )
  }

  const age = ageFrom(patient.date_of_birth)
  const facts = [
    age !== null && { icon: UserRound, text: `${age} years${genderLabel(patient.gender) ? ` · ${genderLabel(patient.gender)}` : ''}` },
    age === null && genderLabel(patient.gender) && { icon: UserRound, text: genderLabel(patient.gender) },
    patient.blood_group && { icon: Droplet, text: `Blood group ${patient.blood_group}` },
    patient.height_cm && { icon: Ruler, text: `${patient.height_cm} cm` },
    patient.phone_number && { icon: Phone, text: patient.phone_number, href: `tel:${patient.phone_number.replace(/\s/g, '')}` },
    { icon: Mail, text: patient.email, href: `mailto:${patient.email}` },
  ].filter(Boolean)

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 sm:flex-row sm:items-center">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-linear-to-br from-rose-500 to-pink-600 text-lg font-bold text-white">
        {initials(patient.full_name)}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Patient report</p>
        <h1 className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {patient.full_name}
          <span className="font-mono text-base font-semibold text-slate-400">ID {patientCode(patient.id)}</span>
        </h1>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
          {facts.map(({ icon: Icon, text, href }) => (
            <li key={text} className="flex min-w-0 items-center gap-1.5">
              <Icon className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              {href ? (
                <a href={href} className="truncate hover:text-rose-600">
                  {text}
                </a>
              ) : (
                <span className="truncate">{text}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
