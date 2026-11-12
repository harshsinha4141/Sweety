import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import DoctorPicker from '../../components/settings/DoctorPicker'
import PasswordForm from '../../components/settings/PasswordForm'
import ProfileForm from '../../components/settings/ProfileForm'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { PATIENT_PROFILE_FIELDS } from '../../lib/profile-options'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user, loadingUser, logout } = useAuth()
  const navigate = useNavigate()
  const ready = user && !loadingUser

  async function handleLogout() {
    await navigate({ to: '/' })
    logout()
    toast.info('You have been logged out.')
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-slate-500">Manage your profile, your doctor and your account.</p>
      </div>

      <div id="doctor" className="scroll-mt-24">
        <Card title="My doctor" subtitle="The doctor who can view your readings and reports.">
          {ready ? (
            <DoctorPicker key={`${user.id}:${user.assigned_doctor}`} user={user} />
          ) : (
            <div className="h-[70px] animate-pulse rounded-xl bg-slate-100" />
          )}
        </Card>
      </div>

      <Card title="Profile" subtitle="These details help your doctor read your reports.">
        {ready ? (
          <ProfileForm key={`${user.id}:${user.updated_at}`} user={user} fields={PATIENT_PROFILE_FIELDS} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[70px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}
      </Card>

      <Card title="Change password">
        <PasswordForm />
      </Card>

      <Card title="Account">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-800">{user?.email}</span>
          </p>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden="true" /> Log out
          </Button>
        </div>
      </Card>
    </div>
  )
}
