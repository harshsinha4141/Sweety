import { Pencil, Trash2 } from 'lucide-react'
import { formatTime } from '../../lib/dates'
import { SLOTS } from '../../lib/glucose'
import StatusBadge from './StatusBadge'

// Compact reading line: slot icon + label, recorded time, value, status, actions.
export default function ReadingRow({ reading, onEdit, onDelete, showDate = false, dateLabel }) {
  const slot = SLOTS[reading.time_slot]
  const Icon = slot?.icon
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ background: `${slot?.color}14`, color: slot?.color }}
      >
        {Icon && <Icon className="size-[18px]" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{slot?.label}</p>
        <p className="text-xs text-slate-500">
          {showDate && dateLabel ? `${dateLabel} · ` : ''}
          Logged at {formatTime(reading.created_at)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-base font-extrabold tabular-nums text-slate-900">
          {reading.glucose_value}
          <span className="ml-1 text-xs font-medium text-slate-400">mg/dl</span>
        </p>
        <StatusBadge status={reading.status} />
      </div>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-0.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(reading)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={`Edit ${slot?.label} reading`}
            >
              <Pencil className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(reading)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${slot?.label} reading`}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      )}
    </li>
  )
}
