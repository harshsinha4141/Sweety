import { CalendarDays, CircleAlert, Clock, Droplet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { todayISO } from '../../lib/dates'
import {
  MAX_READINGS_PER_DAY,
  MESSAGES,
  SLOTS,
  fieldForApiError,
  slotLabel,
  validateReading,
} from '../../lib/glucose'
import { useAsync } from '../../lib/useAsync'
import { readingsService } from '../../services/readings'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import SelectField from '../ui/SelectField'
import TextField from '../ui/TextField'

// Best-guess slot for "now" when adding without a preset slot.
function slotForNow() {
  const h = new Date().getHours()
  if (h < 10) return 0
  if (h < 13) return 1
  if (h < 18) return 2
  return 3
}

// Add / edit a reading. `reading` set = edit mode; `defaults` = { reading_date, time_slot } for add.
export default function ReadingModal({ open, reading, defaults, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reading ? 'Edit reading' : 'Add a reading'}
      description={
        reading ? 'Update the value, date or time slot.' : `You can log up to ${MAX_READINGS_PER_DAY} readings a day.`
      }
    >
      {open && <ReadingForm reading={reading} defaults={defaults} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function ReadingForm({ reading, defaults, onClose, onSaved }) {
  const today = todayISO()
  const isEdit = Boolean(reading)
  const [form, setForm] = useState(() => ({
    reading_date: reading?.reading_date ?? defaults?.reading_date ?? today,
    time_slot: String(reading?.time_slot ?? defaults?.time_slot ?? slotForNow()),
    glucose_value: reading ? String(reading.glucose_value) : '',
  }))
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Readings already on the chosen date → which slots are taken.
  const dateOk = Boolean(form.reading_date) && form.reading_date <= today
  const dayReadings = useAsync(
    () => (dateOk ? readingsService.list({ date: form.reading_date, limit: MAX_READINGS_PER_DAY }) : Promise.resolve(null)),
    `${form.reading_date}:${dateOk}`,
  )
  const takenSlots = (dayReadings.data?.readings ?? [])
    .filter((r) => r.id !== reading?.id)
    .map((r) => r.time_slot)
  const dayFull = !dayReadings.loading && takenSlots.length >= MAX_READINGS_PER_DAY

  const ruleErrors = validateReading(form, { today, takenSlots: dayReadings.loading ? [] : takenSlots })

  // Conflicts (future date, slot taken, day full) show as soon as they happen; everything
  // else after the first submit. Server errors stay until that field is changed.
  const conflicts = {}
  if (ruleErrors.reading_date === MESSAGES.futureDate) conflicts.reading_date = ruleErrors.reading_date
  if (ruleErrors.time_slot && ruleErrors.time_slot !== MESSAGES.slotRequired) conflicts.time_slot = ruleErrors.time_slot
  const shownErrors = { ...(submitted ? ruleErrors : conflicts), ...serverErrors }

  const update = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
    if (serverErrors[field]) {
      setServerErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(ruleErrors).length) return

    const payload = {
      reading_date: form.reading_date,
      time_slot: Number(form.time_slot),
      glucose_value: Number(form.glucose_value),
    }
    setSaving(true)
    try {
      const data = isEdit
        ? await readingsService.update(reading.id, payload)
        : await readingsService.create(payload)
      toast.success(isEdit ? 'Reading updated.' : `${slotLabel(payload.time_slot)} reading saved.`)
      onSaved?.(data.reading)
      onClose()
    } catch (error) {
      const field = fieldForApiError(error.message)
      if (field) setServerErrors((current) => ({ ...current, [field]: error.message }))
      else setFormError(error.message)
      setSaving(false)
    }
  }

  const slotOptions = SLOTS.map((slot) => ({
    value: String(slot.value),
    label: takenSlots.includes(slot.value) ? `${slot.label} — already logged` : slot.label,
  }))

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Date"
          type="date"
          icon={CalendarDays}
          max={today}
          value={form.reading_date}
          onChange={update('reading_date')}
          error={shownErrors.reading_date}
        />
        <SelectField
          label="Time slot"
          icon={Clock}
          placeholder="Select a time slot"
          options={slotOptions}
          value={form.time_slot}
          onChange={update('time_slot')}
          error={shownErrors.time_slot}
        />
      </div>

      <TextField
        label="Glucose value (mg/dl)"
        icon={Droplet}
        inputMode="numeric"
        autoComplete="off"
        placeholder="e.g. 110"
        value={form.glucose_value}
        onChange={update('glucose_value')}
        error={shownErrors.glucose_value}
        hint="Whole number between 40 and 600"
        autoFocus
      />

      {dayFull && !isEdit && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          This date already has {MAX_READINGS_PER_DAY} readings. Edit one of them or choose another date.
        </p>
      )}

      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save reading'}
        </Button>
      </div>
    </form>
  )
}
