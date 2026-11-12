import { CalendarDays, Droplet, Mail, Phone, Ruler, User, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import { todayISO } from '../../lib/dates'
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS, PATIENT_PROFILE_FIELDS } from '../../lib/profile-options'
import { authService } from '../../services/auth'
import Button from '../ui/Button'
import SelectField from '../ui/SelectField'
import TextField from '../ui/TextField'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/

const toForm = (user, fields) =>
  Object.fromEntries(fields.map((f) => [f, user[f] === null || user[f] === undefined ? '' : String(user[f])]))

// Edits the given profile `fields` of the logged-in user (only changed fields are sent).
export default function ProfileForm({ user, fields = PATIENT_PROFILE_FIELDS }) {
  const { updateSession } = useAuth()
  const [initial] = useState(() => toForm(user, fields))
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const has = (field) => fields.includes(field)
  const changed = fields.filter((f) => form[f].trim() !== initial[f].trim())

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'Enter your full name'
    if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (has('phone_number') && form.phone_number.trim() && !PHONE_REGEX.test(form.phone_number.trim())) {
      next.phone_number = 'Enter a valid phone number'
    }
    if (has('date_of_birth') && form.date_of_birth && form.date_of_birth > todayISO()) {
      next.date_of_birth = 'Date of birth cannot be in the future'
    }
    if (has('height_cm') && form.height_cm.trim()) {
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
        {has('phone_number') && (
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
        )}
        {has('date_of_birth') && (
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
        )}
        {has('gender') && (
          <SelectField
            label="Gender"
            icon={Users}
            placeholder="Select"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={update('gender')}
            optional
          />
        )}
        {has('blood_group') && (
          <SelectField
            label="Blood group"
            icon={Droplet}
            placeholder="Select"
            options={BLOOD_GROUP_OPTIONS}
            value={form.blood_group}
            onChange={update('blood_group')}
            optional
          />
        )}
        {has('height_cm') && (
          <TextField
            label="Height (cm)"
            icon={Ruler}
            inputMode="decimal"
            value={form.height_cm}
            onChange={update('height_cm')}
            error={errors.height_cm}
            optional
          />
        )}
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
