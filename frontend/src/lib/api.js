// Backend base URL: VITE_API_URL if set, else the deployed backend in production builds,
// else the local backend in dev.
const DEFAULT_API_URL = import.meta.env.PROD ? 'https://sweety-sigma.vercel.app' : 'http://localhost:3000'
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
const TOKEN_KEY = 'sweety_token'

// localStorage can throw (private mode, blocked storage) — never let that crash the app.
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Called when an authenticated request comes back 401 (expired/invalid token).
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

// The patient's IANA time zone — the backend uses it to decide what "today" is.
function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

// { page: 1, from: '' } → "?page=1" (empty values dropped)
export function toQuery(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

// Calls the Sweety API and returns `data` from `{ success, message, data }`; throws ApiError on failure.
export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const tz = timeZone()
  if (tz) headers['X-Timezone'] = tz
  if (auth) {
    const token = tokenStorage.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("Can't reach the server. Please check your connection and try again.", 0)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok || payload?.success === false) {
    if (auth && response.status === 401 && onUnauthorized) onUnauthorized(payload?.message)
    throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status)
  }
  return payload?.data
}
