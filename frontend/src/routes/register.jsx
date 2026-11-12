import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Droplet,
  HeartPulse,
  Lock,
  Mail,
  Phone,
  Ruler,
  Stethoscope,
  User,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/ui/Button'
import SelectField from '../components/ui/SelectField'
import TextField from '../components/ui/TextField'
import { requireGuest } from '../lib/guards'
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '../lib/profile-options'
import { homeFor, ROLE_IDS } from '../lib/roles'
import { useAsync } from '../lib/useAsync'
import { doctorService } from '../services/doctor'

export const Route = createFileRoute('/register')({
  beforeLoad: requireGuest,
  component: RegisterPage,
})

const MIN_PASSWORD_LENGTH = 8
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const OPTIONAL_FIELDS = ['phone_number', 'date_of_birth', 'gender', 'blood_group', 'height_cm']

const ROLE_CHOICES = [
  {
    value: 'patient',
    icon: HeartPulse,
    title: "I'm a patient",
    text: 'Log readings and see my reports',
  },
  {
    value: 'doctor',
    icon: Stethoscope,
    title: "I'm a doctor",
    text: "View my patients' reports",
  },
]

const EMPTY_FORM = {
  role: '',
  assigned_doctor: '',
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
  if (!form.role) errors.role = 'Choose whether you are a patient or a doctor'
  if (form.role === 'patient' && !form.assigned_doctor) errors.assigned_doctor = 'Choose your doctor'
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
  const payload = {
    role_id: ROLE_IDS[form.role],
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    password: form.password,
  }
  if (form.role === 'patient') payload.assigned_doctor = Number(form.assigned_doctor)
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

  const doctors = useAsync(() => doctorService.list(), 'doctors')
  const doctorOptions = (doctors.data?.doctors ?? []).map((d) => ({ value: String(d.id), label: d.full_name }))
  const noDoctors = form.role === 'patient' && doctors.data && doctorOptions.length === 0

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const update = (field) => (event) => setField(field, event.target.value)

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
      const user = await register(buildPayload(form))
      toast.success(
        user.role === 'doctor' ? 'Doctor account created — welcome to Sweety!' : 'Account created — welcome to Sweety!',
      )
      router.history.push(homeFor(user.role))
    } catch (error) {
      toast.error(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start in under a minute — as a patient or as a doctor."
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
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">I am signing up as</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-describedby={errors.role ? 'role-error' : undefined}>
            {ROLE_CHOICES.map(({ value, icon: Icon, title, text }) => {
              const selected = form.role === value
              return (
                <label
                  key={value}
                  className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-rose-100 ${
                    selected
                      ? 'border-rose-400 bg-rose-50/60 shadow-sm shadow-rose-600/10'
                      : errors.role
                        ? 'border-red-300 hover:border-red-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={selected}
                    onChange={() => setField('role', value)}
                    className="sr-only"
                  />
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      selected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{title}</span>
                    <span className="block text-xs text-slate-500">{text}</span>
                  </span>
                  {selected && (
                    <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-rose-600 text-white">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                  )}
                </label>
              )
            })}
          </div>
          {errors.role && (
            <p id="role-error" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.role}
            </p>
          )}
        </fieldset>

        {form.role === 'patient' && (
          <div className="animate-fade-in">
            <SelectField
              label="Your doctor"
              icon={Stethoscope}
              placeholder={doctors.loading ? 'Loading doctors…' : 'Select your doctor'}
              options={doctorOptions}
              value={form.assigned_doctor}
              onChange={update('assigned_doctor')}
              error={
                errors.assigned_doctor ??
                (doctors.error ? "Couldn't load doctors. Please refresh the page." : undefined)
              }
              hint={
                noDoctors
                  ? 'No doctors have joined Sweety yet — ask your doctor to sign up first.'
                  : 'Only this doctor will be able to see your reports.'
              }
              disabled={doctors.loading || noDoctors}
            />
          </div>
        )}

        <TextField
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder={form.role === 'doctor' ? 'e.g. Dr. Anil Kapoor' : 'e.g. Priya Sharma'}
          value={form.full_name}
          onChange={update('full_name')}
          error={errors.full_name}
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

        {form.role === 'patient' && (
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
                <span className="block text-xs text-slate-500">
                  Optional — phone, date of birth, gender, blood group, height
                </span>
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
        )}

        {form.role === 'doctor' && (
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
        )}

        <Button type="submit" size="lg" full loading={submitting} disabled={noDoctors}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-slate-400">
          Sweety is a record-keeping tool and doesn&apos;t replace advice from your doctor.
        </p>
      </form>
    </AuthLayout>
  )
}
