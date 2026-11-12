import { Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../auth/useAuth'
import { useAsync } from '../../lib/useAsync'
import { authService } from '../../services/auth'
import { doctorService } from '../../services/doctor'
import Button from '../ui/Button'
import SelectField from '../ui/SelectField'

// Patient settings: choose / change the doctor who can see your reports (required, can't be removed).
export default function DoctorPicker({ user }) {
  const { updateSession } = useAuth()
  const initial = user.assigned_doctor ? String(user.assigned_doctor) : ''
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)

  const doctors = useAsync(() => doctorService.list(), 'doctors')
  const options = (doctors.data?.doctors ?? []).map((d) => ({ value: String(d.id), label: d.full_name }))

  async function handleSubmit(event) {
    event.preventDefault()
    if (!value || value === initial) return
    setSaving(true)
    try {
      const data = await authService.updateProfile({ assigned_doctor: Number(value) })
      updateSession(data)
      toast.success(`${data.user.doctor?.full_name ?? 'Your doctor'} can now see your reports.`)
    } catch (error) {
      toast.error(error.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <SelectField
        className="flex-1"
        label="Your doctor"
        icon={Stethoscope}
        placeholder={doctors.loading ? 'Loading doctors…' : 'Select your doctor'}
        options={options}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={doctors.error ? "Couldn't load doctors. Please refresh the page." : undefined}
        hint={
          doctors.data && !options.length
            ? 'No doctors have joined Sweety yet.'
            : 'Only this doctor can see your readings and reports.'
        }
        disabled={doctors.loading || !options.length}
      />
      <Button type="submit" loading={saving} disabled={!value || value === initial} className="sm:mb-6">
        {saving ? 'Saving…' : initial ? 'Change doctor' : 'Save doctor'}
      </Button>
    </form>
  )
}
