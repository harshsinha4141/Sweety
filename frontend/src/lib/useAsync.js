import { useCallback, useEffect, useRef, useState } from 'react'

// Runs `loader()` whenever `key` changes (or reload() is called).
// Keeps the previous data while a new request is in flight.
export function useAsync(loader, key) {
  const [state, setState] = useState({ key: null, data: undefined, error: null })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  const fullKey = `${key}#${nonce}`

  useEffect(() => {
    let cancelled = false
    loaderRef.current().then(
      (data) => {
        if (!cancelled) setState({ key: fullKey, data, error: null })
      },
      (error) => {
        if (!cancelled) setState((prev) => ({ key: fullKey, data: prev.data, error }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [fullKey])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const loading = state.key !== fullKey

  return { data: state.data, error: loading ? null : state.error, loading, reload }
}
