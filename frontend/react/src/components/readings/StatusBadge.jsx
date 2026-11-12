import { STATUS_STYLES } from '../../lib/glucose'

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status]
  if (!style) return null
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.badge}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  )
}
