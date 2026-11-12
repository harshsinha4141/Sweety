import { redirect } from '@tanstack/react-router'
import { tokenStorage } from './api'

// Only allow same-site paths like "/dashboard" (blocks "//evil.com" and absolute URLs).
export function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : undefined
}

// beforeLoad guard for pages that need a logged-in user.
export function requireAuth({ location }) {
  if (!tokenStorage.get()) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}

// beforeLoad guard for login/register: logged-in users go straight to the dashboard.
export function requireGuest() {
  if (tokenStorage.get()) {
    throw redirect({ to: '/dashboard' })
  }
}
