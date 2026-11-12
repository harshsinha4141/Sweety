import { Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { authService } from '../../services/auth'
import Button from '../ui/Button'
import TextField from '../ui/TextField'

const MIN_PASSWORD_LENGTH = 8
const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' }

export default function PasswordForm() {
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
