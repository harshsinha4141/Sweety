import { SLOTS } from './glucose'

// Reminder preferences live in this browser (per user). Reminders fire while Sweety is open in a tab.

export const DEFAULT_REMINDERS = {
  enabled: true,
  browser: false, // system notifications (needs permission); in-app toasts always show
  slots: [
    { enabled: true, time: '07:30' },
    { enabled: true, time: '10:00' },
    { enabled: true, time: '14:30' },
    { enabled: true, time: '21:30' },
  ],
}

const settingsKey = (userId) => `sweety_reminders_${userId}`
const notifiedKey = (userId, date) => `sweety_notified_${userId}_${date}`

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — reminders still work for this session */
  }
}

export function loadReminderSettings(userId) {
  const saved = readJSON(settingsKey(userId), null)
  if (!saved) return DEFAULT_REMINDERS
  return {
    ...DEFAULT_REMINDERS,
    ...saved,
    slots: DEFAULT_REMINDERS.slots.map((slot, i) => ({ ...slot, ...saved.slots?.[i] })),
  }
}

export const saveReminderSettings = (userId, settings) => writeJSON(settingsKey(userId), settings)

export const loadNotified = (userId, date) => readJSON(notifiedKey(userId, date), [])
export const saveNotified = (userId, date, slots) => writeJSON(notifiedKey(userId, date), slots)

const minutesOf = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Splits today's enabled reminders into due (time passed, slot not logged) and upcoming.
export function computeReminders(settings, loggedSlots, now = new Date()) {
  if (!settings.enabled) return { due: [], upcoming: [] }
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const due = []
  const upcoming = []
  settings.slots.forEach((slot, i) => {
    if (!slot.enabled || loggedSlots.includes(i)) return
    const item = { slot: i, label: SLOTS[i].label, time: slot.time }
    if (minutesOf(slot.time) <= nowMinutes) due.push(item)
    else upcoming.push(item)
  })
  upcoming.sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
  return { due, upcoming }
}

export const notificationSupport = () => (typeof window !== 'undefined' && 'Notification' in window)

export function showBrowserNotification(title, body) {
  if (!notificationSupport() || Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body, icon: '/favicon.svg', tag: 'sweety-reminder' })
    return true
  } catch {
    return false
  }
}
