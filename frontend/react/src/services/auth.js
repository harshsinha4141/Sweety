import { apiRequest } from '../lib/api'

// Thin wrappers around the backend /api/auth endpoints.
export const authService = {
  register: (payload) => apiRequest('/api/auth/register', { method: 'POST', body: payload }),
  login: (email, password) =>
    apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => apiRequest('/api/auth/me', { auth: true }),
  // Returns { user, token } — the token is re-issued because it carries the email.
  updateProfile: (changes) => apiRequest('/api/auth/me', { method: 'PUT', body: changes, auth: true }),
  changePassword: (current_password, new_password) =>
    apiRequest('/api/auth/password', { method: 'PUT', body: { current_password, new_password }, auth: true }),
}
