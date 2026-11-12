import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDays, Droplet, Lock, LogOut, Mail, Phone, Ruler, User, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import SelectField from '../../components/ui/SelectField'
import TextField from '../../components/ui/TextField'
import { todayISO } from '../../lib/dates'
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '../../lib/profile-options'
import { authService } from '../../services/auth'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/
const MIN_PASSWORD_LENGTH = 8
const PROFILE_FIELDS = ['full_name', 'email', 'phone_number', 'date_of_birth', 'gender', 'blood_group', 'height_cm']

function SettingsPage() {
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

      <Card title="Profile" subtitle="These details help your doctor read your reports.">
        {!user || loadingUser ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-[70px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <ProfileForm key={`${user.id}:${user.updated_at}`} user={user} />
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

const toForm = (user) =>
  Object.fromEntries(PROFILE_FIELDS.map((f) => [f, user[f] === null || user[f] === undefined ? '' : String(user[f])]))

function ProfileForm({ user }) {
  const { updateSession } = useAuth()
  const [initial] = useState(() => toForm(user))
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const changed = PROFILE_FIELDS.filter((f) => form[f].trim() !== initial[f].trim())

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'Enter your full name'
    if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (form.phone_number.trim() && !PHONE_REGEX.test(form.phone_number.trim())) {
      next.phone_number = 'Enter a valid phone number'
    }
    if (form.date_of_birth && form.date_of_birth > todayISO()) next.date_of_birth = 'Date of birth cannot be in the future'
    if (form.height_cm.trim()) {
      const h = Number(form.height_cm)
      if (!Number.isFinite(h) || h <= 0 || h >= 300) next.height_cm = 'Enter a height in cm'
    }
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !changed.length) return

    // Send only what changed; cleared optional fields go as "" (the API stores null).
    const payload = {}
    for (const f of changed) {
      const value = form[f].trim()
      payload[f] = f === 'height_cm' && value ? Number(value) : value
    }

    setSaving(true)
    try {
      const data = await authService.updateProfile(payload)
      updateSession(data) // new token + user; the form remounts with fresh values
      toast.success('Profile updated.')
    } catch (error) {
      if (error.status === 409) setErrors((e) => ({ ...e, email: error.message }))
      else toast.error(error.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" icon={User} autoComplete="name" value={form.full_name} onChange={update('full_name')} error={errors.full_name} />
        <TextField label="Email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
        <TextField
          label="Phone number"
          type="tel"
          icon={Phone}
          autoComplete="tel"
          value={form.phone_number}
          onChange={update('phone_number')}
          error={errors.phone_number}
          optional
        />
        <TextField
          label="Date of birth"
          type="date"
          icon={CalendarDays}
          max={todayISO()}
          value={form.date_of_birth}
          onChange={update('date_of_birth')}
          error={errors.date_of_birth}
          optional
        />
        <SelectField
          label="Gender"
          icon={Users}
          placeholder="Select"
          options={GENDER_OPTIONS}
          value={form.gender}
          onChange={update('gender')}
          optional
        />
        <SelectField
          label="Blood group"
          icon={Droplet}
          placeholder="Select"
          options={BLOOD_GROUP_OPTIONS}
          value={form.blood_group}
          onChange={update('blood_group')}
          optional
        />
        <TextField
          label="Height (cm)"
          icon={Ruler}
          inputMode="decimal"
          value={form.height_cm}
          onChange={update('height_cm')}
          error={errors.height_cm}
          optional
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {changed.length > 0 && (
          <Button variant="ghost" onClick={() => setForm(initial)} disabled={saving}>
            Discard changes
          </Button>
        )}
        <Button type="submit" loading={saving} disabled={!changed.length}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' }

function PasswordForm() {
  const [form, setForm] = useState(EMPTY_PASSWORDS)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!form.current) next.current = 'Enter your current password'
    if (form.next.length < MIN_PASSWORD_LENGTH) next.next = `Use at least ${MIN_PASSWORD_LENGTH} characters`
    if (form.confirm !== form.next) next.confirm = "Passwords don't match"
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await authService.changePassword(form.current, form.next)
      toast.success('Password changed.')
      setForm(EMPTY_PASSWORDS)
    } catch (error) {
      // "New password must be different from the current password" belongs to the new field.
      if (/new password/i.test(error.message)) setErrors({ next: error.message })
      else if (/current password/i.test(error.message)) setErrors({ current: error.message })
      else toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          label="Current password"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          value={form.current}
          onChange={update('current')}
          error={errors.current}
        />
        <TextField
          label="New password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          value={form.next}
          onChange={update('next')}
          error={errors.next}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
        />
        <TextField
          label="Confirm new password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </form>
  )
}
