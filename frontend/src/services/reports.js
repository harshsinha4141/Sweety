import { apiRequest, toQuery } from '../lib/api'

// Thin wrappers around /api/reports (all authenticated). date = selected YYYY-MM-DD (default today).
export const reportsService = {
  all: (date) => apiRequest(`/api/reports${toQuery({ date })}`, { auth: true }),
  daily: (date) => apiRequest(`/api/reports/daily${toQuery({ date })}`, { auth: true }),
}
