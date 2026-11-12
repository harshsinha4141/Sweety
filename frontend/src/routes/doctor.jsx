import { createFileRoute, Outlet } from '@tanstack/react-router'
import DoctorShell from '../components/doctor/DoctorShell'
import { requireDoctor } from '../lib/guards'

// Layout for every /doctor/* page (logged-in doctors only; patients go to /dashboard).
export const Route = createFileRoute('/doctor')({
  beforeLoad: requireDoctor,
  component: DoctorLayout,
})

function DoctorLayout() {
  return (
    <DoctorShell>
      <Outlet />
    </DoctorShell>
  )
}
