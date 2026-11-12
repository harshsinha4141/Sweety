import { Check, Search } from 'lucide-react'
import SectionHeading from './SectionHeading'

const POINTS = [
  'See every patient assigned to you in one list',
  "Open any assigned patient's daily and monthly report",
  'Spot high or low days and missed readings at a glance',
  'No access to patients who are not assigned to you',
]

// Illustrative sample data for the doctor view preview.
const SAMPLE_PATIENTS = [
  { initials: 'PS', name: 'Priya S.', avg: 118, inRange: 86, status: 'On track' },
  { initials: 'RV', name: 'Rahul V.', avg: 164, inRange: 58, status: 'Review' },
  { initials: 'AI', name: 'Ananya I.', avg: 109, inRange: 92, status: 'On track' },
  { initials: 'KM', name: 'Karan M.', avg: 141, inRange: 71, status: 'Missed readings' },
]

const STATUS_PILL = {
  'On track': 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  Review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Missed readings': 'bg-slate-100 text-slate-600 ring-slate-500/15',
}

function DoctorPreview() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doctor view</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">My patients</p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-400 sm:flex">
          <Search className="size-4" aria-hidden="true" /> Search patients
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:grid-cols-[1fr_auto_auto_auto]">
        <span>Patient</span>
        <span className="text-right">Avg</span>
        <span className="text-right">In range</span>
        <span className="hidden text-right sm:block">Status</span>
      </div>

      <ul className="divide-y divide-slate-100">
        {SAMPLE_PATIENTS.map((patient) => (
          <li
            key={patient.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-rose-50 text-xs font-bold text-rose-700">
                {patient.initials}
              </span>
              <span className="font-semibold text-slate-800">{patient.name}</span>
            </div>
            <span className="text-right text-sm tabular-nums text-slate-700">
              {patient.avg} <span className="text-slate-400">mg/dL</span>
            </span>
            <div className="flex items-center justify-end gap-2">
              <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-100 sm:block">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${patient.inRange}%` }} />
              </span>
              <span className="w-9 text-right text-sm font-semibold tabular-nums text-slate-800">{patient.inRange}%</span>
            </div>
            <span
              className={`hidden justify-self-end rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 sm:inline-block ${STATUS_PILL[patient.status]}`}
            >
              {patient.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ForDoctors() {
  return (
    <section id="doctors" className="scroll-mt-20 bg-slate-50/70 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="For doctors"
            title="Built for the care team, too"
            text="Doctors get their own role in Sweety. Instead of scrolling through photos of paper logbooks, they see clean reports for each patient assigned to them."
          />
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                <span className="text-slate-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <DoctorPreview />
      </div>
    </section>
  )
}
