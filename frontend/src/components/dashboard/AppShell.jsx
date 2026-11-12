import { Link, useNavigate } from '@tanstack/react-router'
import { BellRing, ChartLine, ChevronDown, LayoutDashboard, List, LogOut, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import Logo from '../Logo'
import Button from '../ui/Button'
import { useDashboard } from './dashboard-context'
import NotificationBell from './NotificationBell'
import { useClickOutside } from './useClickOutside'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/readings', label: 'Readings', icon: List },
  { to: '/dashboard/reports', label: 'Reports', icon: ChartLine },
  { to: '/dashboard/reminders', label: 'Reminders', icon: BellRing },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S'

// Sidebar (desktop) / bottom tabs (mobile) + top bar around every dashboard page.
export default function AppShell({ children }) {
  const { openAdd } = useDashboard()

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex-1 space-y-1" aria-label="Dashboard">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: Boolean(exact) }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              activeProps={{ className: 'bg-rose-50! text-rose-700! font-semibold' }}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="rounded-2xl bg-linear-to-br from-rose-500 to-pink-600 p-4 text-white">
          <p className="text-sm font-semibold">Log a reading</p>
          <p className="mt-1 text-xs text-rose-100">Up to 4 a day — fasting and after each meal.</p>
          <button
            type="button"
            onClick={() => openAdd()}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <Plus className="size-4" aria-hidden="true" /> Add reading
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button size="sm" onClick={() => openAdd()} className="hidden sm:inline-flex">
                <Plus className="size-4" aria-hidden="true" /> Add reading
              </Button>
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      {/* Floating add button + bottom tabs on phones */}
      <button
        type="button"
        onClick={() => openAdd()}
        className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-600/30 transition hover:bg-rose-700 sm:hidden"
        aria-label="Add reading"
      >
        <Plus className="size-6" />
      </button>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Dashboard"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: Boolean(exact) }}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
                activeProps={{ className: 'text-rose-600!' }}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))

  async function handleLogout() {
    setOpen(false)
    await navigate({ to: '/' })
    logout()
    toast.info('You have been logged out.')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-rose-500"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-rose-500 to-pink-600 text-xs font-bold text-white">
          {initials(user?.full_name)}
        </span>
        <ChevronDown className="hidden size-4 text-slate-400 sm:block" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10 animate-pop">
          <div className="border-b border-slate-100 px-4 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name ?? 'Loading…'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <Link
            to="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="size-4 text-slate-400" aria-hidden="true" /> Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="size-4 text-slate-400" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
