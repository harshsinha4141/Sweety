import { createFileRoute } from '@tanstack/react-router'
import { BellRing, CircleAlert, Info, MonitorSmartphone, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useDashboard } from '../../components/dashboard/dashboard-context'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Toggle from '../../components/ui/Toggle'
import { formatClock } from '../../lib/dates'
import { SLOTS } from '../../lib/glucose'
import { DEFAULT_REMINDERS, notificationSupport, showBrowserNotification } from '../../lib/reminders'

export const Route = createFileRoute('/dashboard/reminders')({
  component: RemindersPage,
})

const permissionNow = () => (notificationSupport() ? Notification.permission : 'unsupported')

function RemindersPage() {
  const { reminderSettings: settings, updateReminderSettings: save, reminders } = useDashboard()
  const [permission, setPermission] = useState(permissionNow)

  const setSlot = (index, changes) =>
    save({ ...settings, slots: settings.slots.map((s, i) => (i === index ? { ...s, ...changes } : s)) })

  async function enableBrowser(on) {
    if (!on) return save({ ...settings, browser: false })
    if (!notificationSupport()) return toast.error("This browser doesn't support notifications.")
    let result = Notification.permission
    if (result === 'default') result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      save({ ...settings, browser: true })
      toast.success('Browser notifications are on.')
    } else {
      toast.error('Notifications are blocked. Allow them in your browser settings for this site.')
    }
  }

  function sendTest() {
    const title = 'Time for your reading'
    const body = 'This is how Sweety will remind you.'
    toast.info(title)
    if (settings.browser && !showBrowserNotification(title, body)) {
      toast.error('Could not show a browser notification. Check your browser settings.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Reminders</h1>
        <p className="mt-1 text-slate-500">Get a gentle nudge when it&apos;s time for a reading.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <BellRing className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">Reading reminders</p>
              <p className="text-sm text-slate-500">
                {settings.enabled
                  ? reminders.due.length
                    ? `${reminders.due.length} reading${reminders.due.length > 1 ? 's' : ''} due now`
                    : reminders.upcoming[0]
                      ? `Next: ${reminders.upcoming[0].label} at ${formatClock(reminders.upcoming[0].time)}`
                      : 'All done for today'
                  : 'Off'}
              </p>
            </div>
          </div>
          <Toggle checked={settings.enabled} onChange={(on) => save({ ...settings, enabled: on })} label="Reading reminders" />
        </div>
      </Card>

      <Card title="Reminder times" subtitle="You'll be reminded only if that slot isn't logged yet.">
        <ul className="divide-y divide-slate-100">
          {SLOTS.map((slot, i) => {
            const Icon = slot.icon
            const s = settings.slots[i]
            return (
              <li key={slot.value} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: `${slot.color}14`, color: slot.color }}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{slot.label}</p>
                  <p className="text-xs text-slate-500">Default {formatClock(DEFAULT_REMINDERS.slots[i].time)}</p>
                </div>
                <input
                  type="time"
                  value={s.time}
                  disabled={!settings.enabled || !s.enabled}
                  onChange={(e) => e.target.value && setSlot(i, { time: e.target.value })}
                  aria-label={`${slot.label} reminder time`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:opacity-50"
                />
                <Toggle
                  checked={s.enabled}
                  disabled={!settings.enabled}
                  onChange={(on) => setSlot(i, { enabled: on })}
                  label={`${slot.label} reminder`}
                />
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Notifications">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden="true" />
              <div>
                <p className="font-medium text-slate-800">Browser notifications</p>
                <p className="text-sm text-slate-500">
                  {permission === 'unsupported'
                    ? "Your browser doesn't support notifications."
                    : permission === 'denied'
                      ? 'Blocked — allow notifications for this site in your browser settings.'
                      : 'Pop-up alerts on your computer or phone, even when this tab is in the background.'}
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.browser && permission === 'granted'}
              disabled={!settings.enabled || permission === 'unsupported'}
              onChange={enableBrowser}
              label="Browser notifications"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={sendTest} disabled={!settings.enabled}>
              <Send className="size-4" aria-hidden="true" /> Send a test reminder
            </Button>
            <Button variant="ghost" size="sm" onClick={() => save(DEFAULT_REMINDERS)}>
              Reset to defaults
            </Button>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Reminders work while Sweety is open in a browser tab, and are saved on this device.
          </p>
          {permission === 'denied' && (
            <p className="flex items-start gap-2 text-xs font-medium text-amber-700">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              In-app reminders still appear while notifications are blocked.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
