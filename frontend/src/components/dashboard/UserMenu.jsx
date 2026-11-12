import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import { useClickOutside } from './useClickOutside'

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S'

// Avatar button + dropdown (name, email, settings, log out). Shared by the patient and doctor shells.
export default function UserMenu({ settingsTo = '/dashboard/settings', badge }) {
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
            {badge && <p className="mt-1.5">{badge}</p>}
          </div>
          <Link
            to={settingsTo}
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
