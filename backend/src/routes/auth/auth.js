const express = require("express");
const authController = require("../../controllers/auth/auth");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.put("/me", requireAuth, authController.updateMe);
router.put("/password", requireAuth, authController.changePassword);

module.exports = router;
