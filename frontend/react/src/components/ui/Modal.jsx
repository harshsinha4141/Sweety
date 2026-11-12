import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

// Centered dialog (bottom sheet on phones). Esc / backdrop click closes; body scroll is locked.
export default function Modal({ open, onClose, title, description, children, size = 'md' }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the first field (or the panel) when opening.
    const panel = panelRef.current
    const first = panel?.querySelector('input, select, textarea, button:not([data-close])')
    ;(first || panel)?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.()
      if (event.key === 'Tab' && panel) {
        // Keep focus inside the dialog.
        const items = panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
        if (!items.length) return
        const firstItem = items[0]
        const lastItem = items[items.length - 1]
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault()
          lastItem.focus()
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault()
          firstItem.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  const width = size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl outline-none animate-sheet-up sm:rounded-3xl ${width}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-rose-500"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
