const supabase = require("../../config/supabase");
const AppError = require("../../utils/AppError");
const { todayIn } = require("../../utils/date");
const { ROLES } = require("../../utils/roles");
const { MAX_READINGS_PER_DAY, round1, decorate } = require("../glucose_readings/glucose");
const reportsService = require("../reports/reports");
const readingsService = require("../glucose_readings/glucose_readings");

// What a doctor may see about an assigned patient (never password_hash).
const PATIENT_COLUMNS =
  "id, full_name, email, phone_number, date_of_birth, gender, blood_group, height_cm, created_at";
const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

/* ---------- access checks ---------- */

function toPatientId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError("Patient not found.", 404);
  return n;
}

// The patient must exist AND be assigned to this doctor. 404 (not 403) so other
// doctors' patients are indistinguishable from ids that don't exist.
async function getAssignedPatient(doctorId, patientIdParam) {
  const patientId = toPatientId(patientIdParam);
  const { data, error } = await supabase
    .from("users")
    .select(PATIENT_COLUMNS)
    .eq("id", patientId)
    .eq("role_id", ROLES.PATIENT)
    .eq("assigned_doctor", doctorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("Patient not found.", 404);
  return data;
}

/* ---------- data access ---------- */

// Month-to-date readings for many patients, paged past the 1000-row limit.
async function fetchReadingsFor(patientIds, from, to) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("glucose_reading")
      .select("user_id, reading_date, time_slot, glucose_value, created_at")
      .in("user_id", patientIds)
      .gte("reading_date", from)
      .lte("reading_date", to)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows.map(decorate);
  }
}

// Month-to-date numbers for one patient's list row.
function summarize(readings, today) {
  const values = readings.map((r) => r.glucose_value);
  const count = values.length;
  const last = readings.reduce((latest, r) => (!latest || r.created_at > latest ? r.created_at : latest), null);
  return {
    count,
    average: count ? round1(values.reduce((a, b) => a + b, 0) / count) : null,
    highest: count ? Math.max(...values) : null,
    lowest: count ? Math.min(...values) : null,
    high_count: readings.filter((r) => r.status === "high").length,
    low_count: readings.filter((r) => r.status === "low").length,
    today_count: readings.filter((r) => r.reading_date === today).length,
    last_reading_at: last,
  };
}

/* ---------- use cases ---------- */

// GET /api/doctor/list (public) — doctors a patient can choose when registering.
async function listDoctors() {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("role_id", ROLES.DOCTOR)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return { doctors: data };
}

// GET /api/doctor/patients — this doctor's patients with month-to-date stats.
async function listPatients(doctorId, tz) {
  const today = todayIn(tz);
  const from = `${today.slice(0, 7)}-01`;

  const { data: patients, error } = await supabase
    .from("users")
    .select(PATIENT_COLUMNS)
    .eq("role_id", ROLES.PATIENT)
    .eq("assigned_doctor", doctorId)
    .order("full_name", { ascending: true });
  if (error) throw error;

  const readings = patients.length ? await fetchReadingsFor(patients.map((p) => p.id), from, today) : [];
  const byPatient = new Map(patients.map((p) => [p.id, []]));
  for (const r of readings) byPatient.get(r.user_id)?.push(r);

  const rows = patients.map((p) => ({ ...p, month_to_date: summarize(byPatient.get(p.id), today) }));

  return {
    today,
    from,
    readings_per_day: MAX_READINGS_PER_DAY,
    totals: {
      patients: rows.length,
      logged_today: rows.filter((p) => p.month_to_date.today_count > 0).length,
      out_of_range: rows.filter((p) => p.month_to_date.high_count + p.month_to_date.low_count > 0).length,
    },
    patients: rows,
  };
}

// GET /api/doctor/patients/:patientId
async function getPatient(doctorId, patientId) {
  return { patient: await getAssignedPatient(doctorId, patientId) };
}

// GET /api/doctor/patients/:patientId/reports?date= — same reports the patient sees.
async function patientReports(doctorId, patientId, query, tz) {
  const patient = await getAssignedPatient(doctorId, patientId);
  return reportsService.allReports(patient.id, query, tz);
}

// GET /api/doctor/patients/:patientId/readings?page&limit&date|from&to (read-only)
async function patientReadings(doctorId, patientId, query) {
  const patient = await getAssignedPatient(doctorId, patientId);
  return readingsService.listReadings(patient.id, query);
}

// Clears the cached reports of an assigned patient (cache only; the patient's data is untouched).
async function resetPatientReportsCache(doctorId, patientId) {
  const patient = await getAssignedPatient(doctorId, patientId);
  return reportsService.resetCache(patient.id);
}

module.exports = {
  listDoctors,
  listPatients,
  getPatient,
  patientReports,
  patientReadings,
  resetPatientReportsCache,
};
