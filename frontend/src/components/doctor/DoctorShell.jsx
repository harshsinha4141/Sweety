import { Link, useLocation } from '@tanstack/react-router'
import { Settings, ShieldCheck, Users } from 'lucide-react'
import UserMenu from '../dashboard/UserMenu'
import Logo from '../Logo'

// "My patients" stays highlighted on /doctor/patients/:id too; Settings only on its own page.
const NAV = [
  { to: '/doctor', label: 'My patients', icon: Users, isActive: (path) => !path.startsWith('/doctor/settings') },
  { to: '/doctor/settings', label: 'Settings', icon: Settings, isActive: (path) => path.startsWith('/doctor/settings') },
]

const DoctorBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-600/15">
    <ShieldCheck className="size-3" aria-hidden="true" /> Doctor
  </span>
)

// Sidebar (desktop) / bottom tabs (mobile) + top bar around every /doctor page.
export default function DoctorShell({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="flex items-center gap-2 px-2">
          <Logo />
          <DoctorBadge />
        </div>
        <nav className="mt-8 flex-1 space-y-1" aria-label="Doctor">
          {NAV.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(pathname)
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-rose-50 font-semibold text-rose-700'
                    : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-800">Read-only access</p>
          <p className="mt-1 text-xs text-slate-500">
            You see the reports of patients who chose you as their doctor. Patients log their own readings.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <Logo />
              <DoctorBadge />
            </div>
            <div className="hidden lg:block" />
            <UserMenu settingsTo="/doctor/settings" badge={<DoctorBadge />} />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Doctor"
      >
        <ul className="mx-auto grid max-w-xs grid-cols-2">
          {NAV.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(pathname)
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                    active ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
