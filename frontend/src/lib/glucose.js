import { Coffee, Moon, Sunrise, UtensilsCrossed } from 'lucide-react'

export const MAX_READINGS_PER_DAY = 4
export const MIN_VALUE = 40
export const MAX_VALUE = 600

// time_slot values stored in the database (glucose_reading.time_slot).
export const SLOTS = [
  { value: 0, label: 'Morning (fasting)', short: 'Fasting', icon: Sunrise, color: '#f59e0b' },
  { value: 1, label: 'After breakfast', short: 'Breakfast', icon: Coffee, color: '#0ea5e9' },
  { value: 2, label: 'After lunch', short: 'Lunch', icon: UtensilsCrossed, color: '#8b5cf6' },
  { value: 3, label: 'After dinner', short: 'Dinner', icon: Moon, color: '#e11d48' },
]

export const SLOT_OPTIONS = SLOTS.map(({ value, label }) => ({ value, label }))

export const slotLabel = (slot) => SLOTS[slot]?.label ?? 'Unknown slot'

// "an After lunch", "a Morning (fasting)"
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
