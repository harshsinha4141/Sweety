import { Coffee, Moon, Sunrise, UtensilsCrossed } from 'lucide-react'
import { toISODate } from './dates'

export const MAX_READINGS_PER_DAY = 4
export const MIN_VALUE = 40
export const MAX_VALUE = 600

// time_slot values stored in the database (glucose_reading.time_slot).
// start/end = the slot's window in local time (hours, end exclusive) — same as the backend.
// A slot can be logged only today while its window is open; after that it's missed for good.
export const SLOTS = [
  { value: 0, label: 'Before breakfast', short: 'Fasting', icon: Sunrise, color: '#f59e0b', start: 6, end: 10 },
  { value: 1, label: 'After breakfast', short: 'Breakfast', icon: Coffee, color: '#0ea5e9', start: 10, end: 14 },
  { value: 2, label: 'After lunch', short: 'Lunch', icon: UtensilsCrossed, color: '#8b5cf6', start: 14, end: 18 },
  { value: 3, label: 'After dinner', short: 'Dinner', icon: Moon, color: '#e11d48', start: 18, end: 22 },
]

// 6 → "6:00 AM", 14 → "2:00 PM"
export const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`

// "6:00 AM – 10:00 AM"
export const slotWindow = (slot) => `${formatHour(SLOTS[slot].start)} – ${formatHour(SLOTS[slot].end)}`

// The slot open right now, or null (10 PM – 6 AM has none).
export const currentSlot = (now = new Date()) =>
  SLOTS.find((s) => now.getHours() >= s.start && now.getHours() < s.end)?.value ?? null

// The next slot to open later today, or null.
export const nextSlot = (now = new Date()) => SLOTS.find((s) => now.getHours() < s.start) ?? null

// 'open' | 'upcoming' | 'missed' for a slot on a date (YYYY-MM-DD), at `now`.
export function slotState(slot, date, now = new Date()) {
  const today = toISODate(now)
  if (date < today) return 'missed'
  if (date > today) return 'upcoming'
  const hour = now.getHours()
  if (hour < SLOTS[slot].start) return 'upcoming'
  if (hour >= SLOTS[slot].end) return 'missed'
  return 'open'
}

// Saved readings can be edited / deleted only while their slot is still open.
export const isReadingEditable = (reading, now = new Date()) =>
  slotState(reading.time_slot, reading.reading_date, now) === 'open'

export const SLOT_OPTIONS = SLOTS.map(({ value, label }) => ({ value, label }))

export const slotLabel = (slot) => SLOTS[slot]?.label ?? 'Unknown slot'

// "an After lunch", "a Before breakfast"
const withArticle = (label) => `${/^[aeiou]/i.test(label) ? 'an' : 'a'} ${label}`

// Exact messages from the product spec (the backend returns the same ones).
export const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  slotTaken: (slot) => `You already have ${withArticle(slotLabel(slot))} reading for this date.`,
  dayFull: `You can add only ${MAX_READINGS_PER_DAY} readings per day.`,
  futureDate: 'Date cannot be in the future.',
  dateRequired: 'Please select a date.',
  slotRequired: 'Please select a time slot.',
  noSlotOpen: (now = new Date()) => {
    const next = nextSlot(now)
    return next
      ? `No slot is open right now. ${next.label} opens at ${formatHour(next.start)}.`
      : `No slot is open right now. ${SLOTS[0].label} opens tomorrow at ${formatHour(SLOTS[0].start)}.`
  },
  locked: (slot) => `This reading is locked: its time slot (${slotWindow(slot)}) has closed.`,
}

// Client-side check mirroring the API rules. `takenSlots` = slots already used on that date
// (excluding the reading being edited). Returns { field: message }.
export function validateReading({ glucose_value, reading_date, time_slot }, { today, takenSlots = [] }) {
  const errors = {}
  const raw = String(glucose_value ?? '').trim()
  if (!raw) errors.glucose_value = MESSAGES.valueRequired
  else if (!/^\d+$/.test(raw) || Number(raw) < MIN_VALUE || Number(raw) > MAX_VALUE) {
    errors.glucose_value = MESSAGES.valueRange
  }

  if (!reading_date) errors.reading_date = MESSAGES.dateRequired
  else if (reading_date > today) errors.reading_date = MESSAGES.futureDate

  if (time_slot === '' || time_slot === null || time_slot === undefined) errors.time_slot = MESSAGES.slotRequired
  else if (!errors.reading_date) {
    if (takenSlots.length >= MAX_READINGS_PER_DAY) errors.time_slot = MESSAGES.dayFull
    else if (takenSlots.includes(Number(time_slot))) errors.time_slot = MESSAGES.slotTaken(Number(time_slot))
  }
  return errors
}

// Which form field an API error message belongs to (so it shows inline).
export function fieldForApiError(message = '') {
  if (/glucose value|Value must/i.test(message)) return 'glucose_value'
  if (/date/i.test(message) && !/already have/i.test(message)) return 'reading_date'
  if (/already have|only \d+ readings|time slot/i.test(message)) return 'time_slot'
  return null
}

// Status colours (status comes from the API: low / normal / high).
// Project rule (CLAUDE.md): emerald = in range, amber = high, sky = low.
export const STATUS_STYLES = {
  low: { label: 'Low', badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500', text: 'text-sky-600' },
  normal: {
    label: 'In range',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
  high: { label: 'High', badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500', text: 'text-amber-600' },
}

// Target band drawn on charts (matches the backend thresholds).
export const TARGET_LOW = 70
export const TARGET_HIGH = 180
