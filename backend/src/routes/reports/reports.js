const express = require("express");
const reportsController = require("../../controllers/reports/reports");
const { requireAuth } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/requireRole");
const { ROLES } = require("../../utils/roles");

const router = express.Router();

// Patients only — doctors view patient data through /api/doctor.
router.use(requireAuth, requireRole(ROLES.PATIENT));

router.get("/", reportsController.all);
router.get("/daily", reportsController.daily);
router.get("/month-to-date", reportsController.monthToDate);
router.get("/monthly", reportsController.monthly);

module.exports = router;
