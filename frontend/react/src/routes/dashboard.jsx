import { createFileRoute, Outlet } from '@tanstack/react-router'
import AppShell from '../components/dashboard/AppShell'
import DashboardProvider from '../components/dashboard/DashboardProvider'
import { requireAuth } from '../lib/guards'

// Layout for every /dashboard/* page (logged-in users only).
export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <DashboardProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </DashboardProvider>
  )
}
