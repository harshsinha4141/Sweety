const express = require("express");
const readingsController = require("../../controllers/glucose_readings/glucose_readings");
const { requireAuth } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/requireRole");
const { ROLES } = require("../../utils/roles");

const router = express.Router();

// Patients only — doctors view patient data through /api/doctor.
router.use(requireAuth, requireRole(ROLES.PATIENT));

router.get("/slots", readingsController.slots);
router.post("/", readingsController.create);
router.get("/", readingsController.list);
router.get("/:id", readingsController.getOne);
router.put("/:id", readingsController.update);
router.delete("/:id", readingsController.remove);

module.exports = router;
