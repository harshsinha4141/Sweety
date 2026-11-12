import { Link } from '@tanstack/react-router'
import { ArrowRight, Bell, Check, Plus, TrendingDown } from 'lucide-react'
import { buttonClasses } from '../ui/button-styles'

// Illustrative sample data for the product preview card.
const SAMPLE_SLOTS = [
  { label: 'Fasting', time: '7:30 AM', value: 96, status: 'in' },
  { label: 'Before lunch', time: '1:05 PM', value: 118, status: 'in' },
  { label: 'After dinner', time: '9:10 PM', value: 186, status: 'high' },
  { label: 'Bedtime', time: null, value: null },
]

const STATUS_STYLES = {
  in: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', label: 'In range' },
  high: { pill: 'bg-amber-50 text-amber-700 ring-amber-600/20', label: 'High' },
}

function PreviewCard() {
  const logged = SAMPLE_SLOTS.filter((slot) => slot.value !== null).length

  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-linear-to-br from-rose-200/60 via-pink-100/40 to-amber-100/50 blur-2xl" />

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">Thursday, 12 Nov</p>
          </div>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/15">
            {logged} of 4 logged
          </span>
        </div>

        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {SAMPLE_SLOTS.map((slot) => (
            <span
              key={slot.label}
              className={`h-1.5 flex-1 rounded-full ${slot.value !== null ? 'bg-rose-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <ul className="mt-5 space-y-2.5">
          {SAMPLE_SLOTS.map((slot) =>
            slot.value !== null ? (
              <li
                key={slot.label}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{slot.label}</p>
                  <p className="text-xs text-slate-500">{slot.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[slot.status].pill}`}
                  >
                    {STATUS_STYLES[slot.status].label}
                  </span>
                  <p className="text-right">
                    <span className="text-lg font-bold tabular-nums text-slate-900">{slot.value}</span>
                    <span className="ml-1 text-xs text-slate-400">mg/dL</span>
                  </p>
                </div>
              </li>
            ) : (
              <li
                key={slot.label}
                className="flex items-center justify-between rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{slot.label}</p>
                  <p className="text-xs text-slate-500">Not logged yet</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white">
                  <Plus className="size-3.5" aria-hidden="true" /> Add
                </span>
              </li>
            ),
          )}
        </ul>
      </div>

      {/* Floating reminder */}
      <div className="absolute -left-4 -top-6 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur animate-float sm:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <Bell className="size-[18px]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">1 reading left today</p>
          <p className="text-xs text-slate-500">Bedtime check · 10:30 PM</p>
        </div>
      </div>

      {/* Floating monthly stat */}
      <div
        className="absolute -bottom-8 -right-3 hidden rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur animate-float sm:block"
        style={{ animationDelay: '1.5s' }}
      >
        <p className="text-xs font-medium text-slate-500">November average</p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tabular-nums text-slate-900">121</span>
          <span className="text-xs text-slate-400">mg/dL</span>
          <span className="ml-1 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
            <TrendingDown className="size-3.5" aria-hidden="true" /> 6%
          </span>
        </p>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center" aria-hidden="true">
        <div className="h-[36rem] w-[60rem] rounded-full bg-radial from-rose-100/80 via-pink-50/50 to-transparent blur-2xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Made for people living with diabetes
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 text-balance sm:text-5xl lg:text-6xl">
            Your blood sugar, <span className="bg-linear-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">beautifully simple.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 text-pretty">
            Log up to four glucose readings a day, get a gentle nudge when one is missing, and see clear daily and
            monthly reports — that your doctor can review too.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className={buttonClasses({ size: 'lg' })}>
              Start tracking — it&apos;s free
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
              See how it works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {['4 readings a day', 'Daily & monthly reports', 'Doctor access'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4 text-emerald-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:150ms]">
          <PreviewCard />
        </div>
      </div>
    </section>
  )
}
