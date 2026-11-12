const express = require("express");
const reportsController = require("../../controllers/reports/reports");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", reportsController.all);
router.get("/daily", reportsController.daily);
router.get("/month-to-date", reportsController.monthToDate);
router.get("/monthly", reportsController.monthly);

module.exports = router;
