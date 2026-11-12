const express = require("express");
const doctorController = require("../../controllers/doctor/doctor");
const { requireAuth } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/requireRole");
const { ROLES } = require("../../utils/roles");

const router = express.Router();

// Public: the register form lists doctors a patient can choose.
router.get("/list", doctorController.list);

// Everything below: logged-in doctors only, and only their assigned patients.
router.use(requireAuth, requireRole(ROLES.DOCTOR));

router.get("/patients", doctorController.patients);
router.get("/patients/:patientId", doctorController.patient);
router.get("/patients/:patientId/reports", doctorController.patientReports);
router.get("/patients/:patientId/readings", doctorController.patientReadings);

module.exports = router;
