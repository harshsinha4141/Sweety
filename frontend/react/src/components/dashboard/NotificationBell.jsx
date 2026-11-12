import { Link } from '@tanstack/react-router'
import { Bell, BellOff, CheckCircle2, Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { formatClock } from '../../lib/dates'
import { SLOTS } from '../../lib/glucose'
import { useDashboard } from './dashboard-context'
import { useClickOutside } from './useClickOutside'

// Bell with a badge for due reminders and a dropdown listing them.
export default function NotificationBell() {
  const { reminders, reminderSettings, openAdd, today } = useDashboard()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  const count = reminders.due.length
  const next = reminders.upcoming[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-rose-500"
        aria-label={count ? `Notifications: ${count} reading${count > 1 ? 's' : ''} due` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4.5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-4.5 text-white ring-2 ring-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 animate-pop">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Reminders</p>
            <Link
              to="/dashboard/reminders"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Settings
            </Link>
          </div>

          {!reminderSettings.enabled ? (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-slate-500">
              <BellOff className="size-5 text-slate-400" aria-hidden="true" />
              Reminders are turned off.
            </div>
          ) : count === 0 ? (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-slate-600">
              <CheckCircle2 className="size-5 text-emerald-500" aria-hidden="true" />
              <div>
                <p className="font-medium text-slate-800">You&apos;re all caught up</p>
                {next && (
                  <p className="text-slate-500">
                    Next: {next.label} at {formatClock(next.time)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {reminders.due.map((item) => {
                const Icon = SLOTS[item.slot].icon
                return (
                  <li key={item.slot} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">Time for your {item.label} reading</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="size-3" aria-hidden="true" /> Due since {formatClock(item.time)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        openAdd({ reading_date: today, time_slot: item.slot })
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Plus className="size-3.5" aria-hidden="true" /> Log
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
