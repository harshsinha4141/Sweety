import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { CalendarDays, ChevronDown, Droplet, Lock, Mail, Phone, Ruler, User, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/ui/Button'
import SelectField from '../components/ui/SelectField'
import TextField from '../components/ui/TextField'
import { requireGuest } from '../lib/guards'

export const Route = createFileRoute('/register')({
  beforeLoad: requireGuest,
  component: RegisterPage,
})

const MIN_PASSWORD_LENGTH = 8
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g }))
const OPTIONAL_FIELDS = ['phone_number', 'date_of_birth', 'gender', 'blood_group', 'height_cm']

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  phone_number: '',
  date_of_birth: '',
  gender: '',
  blood_group: '',
  height_cm: '',
}

// Local date as YYYY-MM-DD (toISOString would give the UTC date).
function todayISO() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'Enter your full name'
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Enter a valid email address'
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (form.confirm_password !== form.password) errors.confirm_password = "Passwords don't match"
  if (form.height_cm !== '') {
    const height = Number(form.height_cm)
    if (!Number.isFinite(height) || height <= 0 || height >= 300) errors.height_cm = 'Enter a height in cm'
  }
  return errors
}

function buildPayload(form) {
  const payload = { full_name: form.full_name.trim(), email: form.email.trim(), password: form.password }
  for (const field of OPTIONAL_FIELDS) {
    const value = form[field].trim()
    if (value) payload[field] = field === 'height_cm' ? Number(value) : value
  }
  return payload
}

function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [showDetails, setShowDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (nextErrors.height_cm) setShowDetails(true)
      return
    }

    setSubmitting(true)
    try {
      await register(buildPayload(form))
      toast.success('Account created — welcome to Sweety!')
      router.history.push('/dashboard')
    } catch (error) {
      toast.error(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start logging your readings in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="e.g. Priya Sharma"
          value={form.full_name}
          onChange={update('full_name')}
          error={errors.full_name}
          autoFocus
        />
        <TextField
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
          />
          <TextField
            label="Confirm password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Repeat password"
            value={form.confirm_password}
            onChange={update('confirm_password')}
            error={errors.confirm_password}
          />
        </div>

        <div className="rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            aria-controls="health-details"
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition hover:bg-slate-50"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-800">Health details</span>
              <span className="block text-xs text-slate-500">Optional — phone, date of birth, gender, blood group, height</span>
            </span>
            <ChevronDown
              className={`size-5 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {showDetails && (
            <div id="health-details" className="grid gap-5 border-t border-slate-200 p-4 sm:grid-cols-2">
              <TextField
                label="Phone number"
                type="tel"
                icon={Phone}
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={form.phone_number}
                onChange={update('phone_number')}
                optional
              />
              <TextField
                label="Date of birth"
                type="date"
                icon={CalendarDays}
                autoComplete="bday"
                max={todayISO()}
                value={form.date_of_birth}
                onChange={update('date_of_birth')}
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
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                icon={Ruler}
                placeholder="e.g. 170"
                value={form.height_cm}
                onChange={update('height_cm')}
                error={errors.height_cm}
                optional
                className="sm:col-span-2"
              />
            </div>
          )}
        </div>

        <Button type="submit" size="lg" full loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-slate-400">
          Sweety is a record-keeping tool and doesn&apos;t replace advice from your doctor.
        </p>
      </form>
    </AuthLayout>
  )
}
