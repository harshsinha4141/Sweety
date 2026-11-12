import { apiRequest, toQuery } from '../lib/api'

// Thin wrappers around /api/doctor.
export const doctorService = {
  // Public — doctors a patient can choose on the register form / in settings.
  list: () => apiRequest('/api/doctor/list'),

  // Doctor only — assigned patients and their (read-only) data.
  patients: () => apiRequest('/api/doctor/patients', { auth: true }),
  patient: (patientId) => apiRequest(`/api/doctor/patients/${patientId}`, { auth: true }),
  reports: (patientId, date) =>
    apiRequest(`/api/doctor/patients/${patientId}/reports${toQuery({ date })}`, { auth: true }),
  resetReportsCache: (patientId) =>
    apiRequest(`/api/doctor/patients/${patientId}/reports/reset-cache`, { method: 'POST', auth: true }),
  // params: { page, limit, date } or { page, limit, from, to }
  readings: (patientId, params) =>
    apiRequest(`/api/doctor/patients/${patientId}/readings${toQuery(params)}`, { auth: true }),
}
