import { createFileRoute, Outlet } from '@tanstack/react-router'
import AppShell from '../components/dashboard/AppShell'
import DashboardProvider from '../components/dashboard/DashboardProvider'
import { requirePatient } from '../lib/guards'

// Layout for every /dashboard/* page (logged-in patients only; doctors go to /doctor).
export const Route = createFileRoute('/dashboard')({
  beforeLoad: requirePatient,
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
