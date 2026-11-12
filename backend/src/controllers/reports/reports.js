const reportsService = require("../../services/reports/reports");
const sendError = require("../../utils/sendError");

// Controller: only passes request data to the service and sends the HTTP response.
// All endpoints take ?date=YYYY-MM-DD (the selected date, default today).

const handle = (serviceFn) => async (req, res) => {
  try {
    const data = await serviceFn(req.user.id, req.query, req.get("x-timezone"));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// POST /api/reports/reset-cache — "hard reset": drop this patient's cached reports.
async function resetCache(req, res) {
  try {
    const data = await reportsService.resetCache(req.user.id);
    return res.status(200).json({ success: true, message: "Report cache cleared", data });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  resetCache,
  all: handle(reportsService.allReports), // GET /api/reports
  daily: handle(reportsService.dailyReport), // GET /api/reports/daily
  monthToDate: handle(reportsService.monthToDateReport), // GET /api/reports/month-to-date
  monthly: handle(reportsService.monthlyReport), // GET /api/reports/monthly
};
