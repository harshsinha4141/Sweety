import { Bell, ChartColumn, Check, Stethoscope } from 'lucide-react'
import Logo from './Logo'

const HIGHLIGHTS = [
  { icon: Check, text: 'Log up to 4 readings a day in seconds' },
  { icon: ChartColumn, text: 'Clear daily and monthly reports' },
  { icon: Bell, text: 'A gentle reminder when a reading is missing' },
  { icon: Stethoscope, text: 'Share reports with your assigned doctor' },
]

// Split-screen layout for the login and register pages.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-rose-500 via-rose-600 to-pink-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-balance">
            Small daily habits, a clearer picture of your health.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-rose-50">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-rose-100/80">
          Sweety keeps your log. Your doctor makes the medical decisions.
        </p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
