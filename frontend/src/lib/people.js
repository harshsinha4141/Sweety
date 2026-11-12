import { todayISO } from './dates'
import { GENDER_OPTIONS } from './profile-options'

// "Priya Sharma" → "PS"
export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

// Whole years from a YYYY-MM-DD date of birth to today (null if unknown).
export function ageFrom(dob) {
  if (!dob) return null
  const [by, bm, bd] = dob.split('-').map(Number)
  const [ty, tm, td] = todayISO().split('-').map(Number)
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0)
}

export const genderLabel = (value) => GENDER_OPTIONS.find((g) => g.value === value)?.label ?? null

// Patient ID as shown to doctors: users.id → "#12"
export const patientCode = (id) => `#${id}`
