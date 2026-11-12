import { Bell, ChartColumn, Droplet, UserPlus } from 'lucide-react'
import SectionHeading from './SectionHeading'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your account',
    text: 'Sign up in under a minute. Add health details like blood group and height if you want.',
  },
  {
    icon: Droplet,
    title: 'Log your readings',
    text: 'Add up to 4 readings each day — value, time and whether it was fasting, before or after a meal, or bedtime.',
  },
  {
    icon: Bell,
    title: 'Get a gentle reminder',
    text: "If the day is ending and you've logged fewer than 4 readings, Sweety nudges you to fill the gap.",
  },
  {
    icon: ChartColumn,
    title: 'Review with your doctor',
    text: 'Open your daily and monthly reports anytime. Your assigned doctor can review the same reports.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From first reading to a full monthly picture"
          text="Four simple steps. Most people are set up and logging their first reading within two minutes."
        />

        <div className="relative mt-16">
          <div
            className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-linear-to-r from-rose-200 via-rose-300 to-rose-200 lg:block"
            aria-hidden="true"
          />
        <ol className="relative grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative text-center">
              <div className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-white text-rose-600 shadow-lg shadow-rose-900/5 ring-1 ring-rose-100">
                <Icon className="size-6" aria-hidden="true" />
                <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-rose-600 text-xs font-bold text-white ring-4 ring-white">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  )
}
