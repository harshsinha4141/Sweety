import { tokenStorage } from './api'

// Mirrors the backend `roles` table (users.role_id).
export const ROLE_IDS = { patient: 1, doctor: 2 }

// Each role's home page after login.
export const homeFor = (role) => (role === 'doctor' ? '/doctor' : '/dashboard')

// Role read from the saved JWT, synchronously, so route guards can redirect before any request.
// Not a security check — the backend verifies the token and the role on every request.
// Tokens issued before roles existed have no role_id; those accounts are all patients.
export function tokenRole() {
  const token = tokenStorage.get()
  if (!token) return null
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return Number(payload.role_id) === ROLE_IDS.doctor ? 'doctor' : 'patient'
  } catch {
    return 'patient'
  }
}
