const { verifyToken } = require("../services/auth/auth");

// Expects header: Authorization: Bearer <jwt>
// On success sets req.user = { id, email, role_id } where id is users.id
// (role_id is undefined for tokens issued before roles existed — requireRole looks it up).
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, message: "Authentication token missing" });
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role_id: payload.role_id ? Number(payload.role_id) : undefined,
    };
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid token";
    return res.status(401).json({ success: false, message });
  }
}

module.exports = { requireAuth };
