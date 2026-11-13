import { CircleAlert, Clock, Droplet, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { formatDate, todayISO } from '../../lib/dates'
import {
  MAX_READINGS_PER_DAY,
  MESSAGES,
  SLOTS,
  currentSlot,
  fieldForApiError,
  isReadingEditable,
  slotLabel,
  slotWindow,
  validateReading,
} from '../../lib/glucose'
import { useAsync } from '../../lib/useAsync'
import { readingsService } from '../../services/readings'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import TextField from '../ui/TextField'

// Add / edit a reading. `reading` set = edit mode.
// Time-window rule: a new reading always goes to TODAY's slot that is open right now
// (6–10 AM, 10 AM–2 PM, 2–6 PM, 6–10 PM); missed slots can't be filled in later, and a saved
// reading can only be changed while its slot is still open. The API enforces the same rule.
export default function ReadingModal({ open, reading, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reading ? 'Edit reading' : 'Add a reading'}
      description={
        reading
          ? 'You can change the value while this slot is still open.'
          : `Log the reading for the slot that's open now (up to ${MAX_READINGS_PER_DAY} a day).`
      }
    >
      {open && <ReadingForm reading={reading} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function ReadingForm({ reading, onClose, onSaved }) {
  const today = todayISO()
  const isEdit = Boolean(reading)
  // Fixed when the form opens: the reading's own slot, or the slot open right now.
  const [now] = useState(() => new Date())
  const date = reading?.reading_date ?? today
  const slot = isEdit ? reading.time_slot : currentSlot(now)

  const [value, setValue] = useState(reading ? String(reading.glucose_value) : '')
  const [serverError, setServerError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Today's readings → is the open slot already logged?
  const dayReadings = useAsync(
    () => (isEdit || slot === null ? Promise.resolve(null) : readingsService.list({ date, limit: MAX_READINGS_PER_DAY })),
    `${date}:${slot}:${isEdit}`,
  )
  const takenSlots = (dayReadings.data?.readings ?? []).map((r) => r.time_slot)

  // Why this form can't be used right now (null = it can).
  let blocked = null
  if (isEdit && !isReadingEditable(reading, now)) blocked = MESSAGES.locked(reading.time_slot)
  else if (!isEdit && slot === null) blocked = MESSAGES.noSlotOpen(now)
  else if (!isEdit && !dayReadings.loading && takenSlots.includes(slot)) blocked = MESSAGES.slotTaken(slot)
  else if (!isEdit && !dayReadings.loading && takenSlots.length >= MAX_READINGS_PER_DAY) blocked = MESSAGES.dayFull

  const valueError = validateReading(
    { glucose_value: value, reading_date: date, time_slot: slot ?? 0 },
    { today },
  ).glucose_value
  const shownValueError = serverError || (submitted ? valueError : undefined)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (blocked || valueError) return

    setSaving(true)
    try {
      const data = isEdit
        ? await readingsService.update(reading.id, { glucose_value: Number(value) })
        : await readingsService.create({ reading_date: date, time_slot: slot, glucose_value: Number(value) })
      toast.success(isEdit ? 'Reading updated.' : `${slotLabel(slot)} reading saved.`)
      onSaved?.(data.reading)
      onClose()
    } catch (error) {
      if (fieldForApiError(error.message) === 'glucose_value') setServerError(error.message)
      else setFormError(error.message)
      setSaving(false)
    }
  }

  const slotInfo = slot === null ? null : SLOTS[slot]
  const SlotIcon = slotInfo?.icon

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {slotInfo && (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ background: `${slotInfo.color}14`, color: slotInfo.color }}
          >
            <SlotIcon className="size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{slotInfo.label}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="size-3" aria-hidden="true" />
              {date === today ? 'Today' : formatDate(date)} · open {slotWindow(slot)}
            </p>
          </div>
        </div>
      )}

      {blocked ? (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {isEdit ? (
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          {blocked}
        </p>
      ) : (
        <TextField
          label="Glucose value (mg/dl)"
          icon={Droplet}
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 110"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setServerError('')
            setFormError('')
          }}
          error={shownValueError}
          hint="Whole number between 40 and 600"
          autoFocus
        />
      )}

      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {blocked ? 'Close' : 'Cancel'}
        </Button>
        {!blocked && (
          <Button type="submit" loading={saving} disabled={dayReadings.loading}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save reading'}
          </Button>
        )}
      </div>
    </form>
  )
}
