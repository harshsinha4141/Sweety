import { Bell, CalendarDays, ChartColumn, Droplet, ShieldCheck, Stethoscope } from 'lucide-react'
import SectionHeading from './SectionHeading'

const FEATURES = [
  {
    icon: Droplet,
    title: 'Four readings a day',
    text: 'Fasting, before meals, after meals, bedtime — log each reading in seconds. Four slots keep every day focused and complete.',
    tone: 'bg-rose-50 text-rose-600',
  },
  {
    icon: ChartColumn,
    title: 'Daily report',
    text: "See every reading for the day with its lowest, highest and average value, and which ones were in range.",
    tone: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: CalendarDays,
    title: 'Monthly report',
    text: 'Day-by-day averages for the whole month, how many days you logged, and how often you stayed in range.',
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Bell,
    title: 'Daily reminder',
    text: "Logged fewer than 4 readings today? Sweety reminds you before the day ends, so gaps don't creep into your reports.",
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Stethoscope,
    title: 'Doctor access',
    text: 'Doctors can view the daily and monthly reports of the patients assigned to them — and only those patients.',
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'Passwords are securely hashed, and your readings are visible only to you and the doctor you are assigned to.',
    tone: 'bg-violet-50 text-violet-600',
  },
]

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-slate-50/70 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="What Sweety does"
          title="Everything you need to stay on top of your glucose"
          text="No clutter, no complicated charts to decode — just the readings that matter and reports that make sense."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, tone }) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <span className={`grid size-11 place-items-center rounded-xl ${tone} transition group-hover:scale-110`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
