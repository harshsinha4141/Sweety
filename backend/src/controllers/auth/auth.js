const authService = require("../../services/auth/auth");

// Controller: only passes request data to the service and sends the HTTP response.

function sendError(res, error) {
  if (error instanceof authService.AuthError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: "Something went wrong" });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const data = await authService.registerUser(req.body);
    return res.status(201).json({ success: true, message: "Registered successfully", data });
  } catch (error) {
    return sendError(res, error);
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const data = await authService.loginUser(req.body);
    return res.status(200).json({ success: true, message: "Logged in successfully", data });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/auth/me  (protected)
async function me(req, res) {
  try {
    const data = await authService.getSession(req.user.id, req.user.role_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

// PUT /api/auth/me  (protected)
async function updateMe(req, res) {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({ success: true, message: "Profile updated", data });
  } catch (error) {
    return sendError(res, error);
  }
}

// PUT /api/auth/password  (protected)
async function changePassword(req, res) {
  try {
    await authService.changePassword(req.user.id, req.body);
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { register, login, me, updateMe, changePassword };
