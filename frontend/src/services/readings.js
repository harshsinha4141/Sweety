import { apiRequest, toQuery } from '../lib/api'

// Thin wrappers around /api/readings (all authenticated).
export const readingsService = {
  // params: { page, limit, date } or { page, limit, from, to }
  list: (params) => apiRequest(`/api/readings${toQuery(params)}`, { auth: true }),
  create: (reading) => apiRequest('/api/readings', { method: 'POST', body: reading, auth: true }),
  update: (id, changes) => apiRequest(`/api/readings/${id}`, { method: 'PUT', body: changes, auth: true }),
  remove: (id) => apiRequest(`/api/readings/${id}`, { method: 'DELETE', auth: true }),
}
