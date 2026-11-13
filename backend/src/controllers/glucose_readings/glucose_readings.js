const readingsService = require("../../services/glucose_readings/glucose_readings");
const sendError = require("../../utils/sendError");

// Controller: only passes request data to the service and sends the HTTP response.
// X-Timezone (IANA name, e.g. "Asia/Kolkata") tells the service what "today" is for the patient.

// GET /api/readings/slots
function slots(req, res) {
  return res.status(200).json({ success: true, data: readingsService.listSlots(req.get("x-timezone")) });
}

// POST /api/readings
async function create(req, res) {
  try {
    const reading = await readingsService.createReading(req.user.id, req.body, req.get("x-timezone"));
    return res.status(201).json({ success: true, message: "Reading added", data: { reading } });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/readings?page=1&limit=20[&date= | &from=&to=]
async function list(req, res) {
  try {
    const data = await readingsService.listReadings(req.user.id, req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/readings/:id
async function getOne(req, res) {
  try {
    const reading = await readingsService.getReading(req.user.id, req.params.id);
    return res.status(200).json({ success: true, data: { reading } });
  } catch (error) {
    return sendError(res, error);
  }
}

// PUT /api/readings/:id
async function update(req, res) {
  try {
    const reading = await readingsService.updateReading(
      req.user.id,
      req.params.id,
      req.body,
      req.get("x-timezone")
    );
    return res.status(200).json({ success: true, message: "Reading updated", data: { reading } });
  } catch (error) {
    return sendError(res, error);
  }
}

// DELETE /api/readings/:id
async function remove(req, res) {
  try {
    const data = await readingsService.deleteReading(req.user.id, req.params.id, req.get("x-timezone"));
    return res.status(200).json({ success: true, message: "Reading deleted", data });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { slots, create, list, getOne, update, remove };
