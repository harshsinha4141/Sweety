import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import { formatClock, formatDate, toISODate } from '../../lib/dates'
import { slotLabel } from '../../lib/glucose'
import {
  computeReminders,
  loadNotified,
  loadRead,
  loadReminderSettings,
  saveNotified,
  saveRead,
  saveReminderSettings,
  showBrowserNotification,
} from '../../lib/reminders'
import { useAsync } from '../../lib/useAsync'
import { readingsService } from '../../services/readings'
import { reportsService } from '../../services/reports'
import ReadingModal from '../readings/ReadingModal'
import ConfirmDialog from '../ui/ConfirmDialog'
import { DashboardContext } from './dashboard-context'

const TICK_MS = 30_000

// Shared dashboard state: today's report, a data version (bumped after every change),
// the add/edit/delete dialogs, and reminders.
export default function DashboardProvider({ children }) {
  const { user } = useAuth()
  const userKey = user?.id ?? null

  // Clock tick so "today" rolls over at midnight and reminders become due on time.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(id)
  }, [])
  const today = toISODate(now)

  // Bumped after add / edit / delete so every page refetches.
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const todayReport = useAsync(() => reportsService.daily(today), `${today}:${version}`)

  /* ---------- add / edit dialog ---------- */
  const [editor, setEditor] = useState({ open: false, reading: null, defaults: null })
  const openAdd = useCallback((defaults = null) => setEditor({ open: true, reading: null, defaults }), [])
  const openEdit = useCallback((reading) => setEditor({ open: true, reading, defaults: null }), [])
  const closeEditor = useCallback(() => setEditor((e) => ({ ...e, open: false })), [])

  /* ---------- delete confirmation ---------- */
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const requestDelete = useCallback((reading) => setToDelete(reading), [])

  async function confirmDelete() {
    setDeleting(true)
    try {
      await readingsService.remove(toDelete.id)
      toast.success('Reading deleted.')
      setToDelete(null)
      refresh()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  /* ---------- reminders ---------- */
  const [settingsOverride, setSettingsOverride] = useState({})
  const reminderSettings = useMemo(
    () => settingsOverride[userKey] ?? loadReminderSettings(userKey ?? 'guest'),
    [settingsOverride, userKey],
  )
  const updateReminderSettings = useCallback(
    (next) => {
      if (userKey == null) return
      saveReminderSettings(userKey, next)
      setSettingsOverride((current) => ({ ...current, [userKey]: next }))
    },
    [userKey],
  )

  // The daily report carries its day in `from` (= `to`); there is no `date` field.
  const reportForToday = todayReport.data?.from === today ? todayReport.data : null
  const loggedSlots = useMemo(
    () => (reportForToday?.readings ?? []).map((r) => r.time_slot),
    [reportForToday],
  )
  const reminders = useMemo(
    () => (reportForToday ? computeReminders(reminderSettings, loggedSlots, now) : { due: [], upcoming: [] }),
    [reportForToday, reminderSettings, loggedSlots, now],
  )

  // Read / unread state of the bell's notifications (per user, per day).
  const readStoreKey = `${userKey}:${today}`
  const [readOverride, setReadOverride] = useState({})
  const readSlots = useMemo(
    () => readOverride[readStoreKey] ?? (userKey == null ? [] : loadRead(userKey, today)),
    [readOverride, readStoreKey, userKey, today],
  )
  const markRead = useCallback(
    (slots) => {
      if (userKey == null) return
      const next = [...new Set([...readSlots, ...slots])]
      if (next.length === readSlots.length) return
      saveRead(userKey, today, next)
      setReadOverride((current) => ({ ...current, [readStoreKey]: next }))
    },
    [readSlots, readStoreKey, today, userKey],
  )
  const unreadCount = useMemo(
    () => reminders.due.filter((r) => !readSlots.includes(r.slot)).length,
    [reminders.due, readSlots],
  )

  // Notify once per slot per day when a reminder becomes due.
  useEffect(() => {
    if (userKey == null || !reminders.due.length) return
    const notified = loadNotified(userKey, today)
    const fresh = reminders.due.filter((r) => !notified.includes(r.slot))
    if (!fresh.length) return
    saveNotified(userKey, today, [...notified, ...fresh.map((r) => r.slot)])

    const title = fresh.length === 1 ? `Time for your ${fresh[0].label} reading` : `${fresh.length} readings are due`
    const body =
      fresh.length === 1
        ? `Scheduled for ${formatClock(fresh[0].time)}. Tap to log it in Sweety.`
        : `${fresh.map((r) => r.label).join(', ')} — log them in Sweety.`
    toast.info(title, { toastId: `reminder-${today}-${fresh.map((r) => r.slot).join('-')}` })
    if (reminderSettings.browser) showBrowserNotification(title, body)
  }, [reminders.due, reminderSettings.browser, today, userKey])

  const value = useMemo(
    () => ({
      today,
      now,
      version,
      refresh,
      todayReport: reportForToday,
      todayLoading: !reportForToday && !todayReport.error,
      todayError: todayReport.error,
      openAdd,
      openEdit,
      requestDelete,
      reminderSettings,
      updateReminderSettings,
      reminders,
      readSlots,
      markRead,
      unreadCount,
    }),
    [
      today,
      now,
      version,
      refresh,
      reportForToday,
      todayReport.error,
      openAdd,
      openEdit,
      requestDelete,
      reminderSettings,
      updateReminderSettings,
      reminders,
      readSlots,
      markRead,
      unreadCount,
    ],
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
      <ReadingModal
        open={editor.open}
        reading={editor.reading}
        onClose={closeEditor}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this reading?"
        description={
          toDelete
            ? `${slotLabel(toDelete.time_slot)} · ${formatDate(toDelete.reading_date)} · ${toDelete.glucose_value} mg/dl. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </DashboardContext.Provider>
  )
}
