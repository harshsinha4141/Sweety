import { useEffect, useRef } from 'react'

// Calls onOutside when a pointer-down or Escape happens outside the returned ref (while active).
export function useClickOutside(active, onOutside) {
  const ref = useRef(null)
  const callbackRef = useRef(onOutside)

  useEffect(() => {
    callbackRef.current = onOutside
  })

  useEffect(() => {
    if (!active) return undefined
    const onPointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) callbackRef.current()
    }
    const onKey = (event) => {
      if (event.key === 'Escape') callbackRef.current()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [active])

  return ref
}
