const { getRoleId } = require("../services/auth/auth");
const { ROLES } = require("../utils/roles");

const DENIED = {
  [ROLES.DOCTOR]: "This area is for doctors only.",
  [ROLES.PATIENT]: "This area is for patients only.",
};

// Use after requireAuth. Allows the request only for the given role ids (from utils/roles).
// The role is always read from the database: the one inside the JWT can be stale
// (account role changed after login) or missing (tokens issued before roles existed).
function requireRole(...allowed) {
  return async (req, res, next) => {
    try {
      req.user.role_id = await getRoleId(req.user.id);
      if (!allowed.includes(req.user.role_id)) {
        return res.status(403).json({ success: false, message: DENIED[allowed[0]] });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { requireRole };
