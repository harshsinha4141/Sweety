import { useCallback, useEffect, useMemo, useState } from 'react'
import { tokenStorage } from '../lib/api'
import { router } from '../router'
import { authService } from '../services/auth'
import { AuthContext } from './auth-context'

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get())
  const [user, setUser] = useState(null)
  // True only while restoring a saved session on first load.
  const [loadingUser, setLoadingUser] = useState(() => Boolean(tokenStorage.get()))

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
    router.invalidate() // re-run route guards so protected pages redirect
  }, [])

  // Restore the session from a saved token once on startup.
  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    authService
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch((error) => {
        if (!cancelled && (error.status === 401 || error.status === 404)) clearSession()
      })
      .finally(() => {
        if (!cancelled) setLoadingUser(false)
      })
    return () => {
      cancelled = true
    }
  }, [clearSession])

  const saveSession = useCallback((data) => {
    tokenStorage.set(data.token)
    setToken(data.token)
    setUser(data.user)
    setLoadingUser(false)
    return data.user
  }, [])

  const login = useCallback(
    async (email, password) => saveSession(await authService.login(email, password)),
    [saveSession],
  )

  const register = useCallback(
    async (payload) => saveSession(await authService.register(payload)),
    [saveSession],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      loadingUser,
      login,
      register,
      logout: clearSession,
    }),
    [user, token, loadingUser, login, register, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
