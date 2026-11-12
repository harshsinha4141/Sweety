import { redirect } from '@tanstack/react-router'
import { tokenStorage } from './api'
import { homeFor, tokenRole } from './roles'

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

// beforeLoad guard for one role's area: logged-in users of the other role go to their own home.
const requireRole = (role) => (context) => {
  requireAuth(context)
  const current = tokenRole()
  if (current !== role) throw redirect({ to: homeFor(current) })
}

export const requirePatient = requireRole('patient') // /dashboard/*
export const requireDoctor = requireRole('doctor') // /doctor/*

// beforeLoad guard for login/register: logged-in users go straight to their home page.
export function requireGuest() {
  if (tokenStorage.get()) {
    throw redirect({ to: homeFor(tokenRole()) })
  }
}
