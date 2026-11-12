const doctorService = require("../../services/doctor/doctor");
const sendError = require("../../utils/sendError");

// Controller: only passes request data to the service and sends the HTTP response.

// GET /api/doctor/list  (public)
async function list(req, res) {
  try {
    const data = await doctorService.listDoctors();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/doctor/patients
async function patients(req, res) {
  try {
    const data = await doctorService.listPatients(req.user.id, req.get("x-timezone"));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/doctor/patients/:patientId
async function patient(req, res) {
  try {
    const data = await doctorService.getPatient(req.user.id, req.params.patientId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/doctor/patients/:patientId/reports?date=YYYY-MM-DD
async function patientReports(req, res) {
  try {
    const data = await doctorService.patientReports(
      req.user.id,
      req.params.patientId,
      req.query,
      req.get("x-timezone")
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/doctor/patients/:patientId/readings
async function patientReadings(req, res) {
  try {
    const data = await doctorService.patientReadings(req.user.id, req.params.patientId, req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { list, patients, patient, patientReports, patientReadings };
