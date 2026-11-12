import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import PasswordForm from '../../components/settings/PasswordForm'
import ProfileForm from '../../components/settings/ProfileForm'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { DOCTOR_PROFILE_FIELDS } from '../../lib/profile-options'

export const Route = createFileRoute('/doctor/settings')({
  component: DoctorSettingsPage,
})

function DoctorSettingsPage() {
  const { user, loadingUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await navigate({ to: '/' })
    logout()
    toast.info('You have been logged out.')
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-slate-500">Manage your profile and account.</p>
      </div>

      <Card title="Profile" subtitle="Patients see your name when they choose their doctor.">
        {!user || loadingUser ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-[70px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <ProfileForm key={`${user.id}:${user.updated_at}`} user={user} fields={DOCTOR_PROFILE_FIELDS} />
        )}
      </Card>

      <Card title="Change password">
        <PasswordForm />
      </Card>

      <Card title="Account">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-800">{user?.email}</span> (doctor)
          </p>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden="true" /> Log out
          </Button>
        </div>
      </Card>
    </div>
  )
}
