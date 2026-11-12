// Mirrors the `roles` table: 1 = patient, 2 = doctor (users.role_id).
const ROLES = Object.freeze({ PATIENT: 1, DOCTOR: 2 });

const ROLE_NAMES = Object.freeze({ [ROLES.PATIENT]: "patient", [ROLES.DOCTOR]: "doctor" });

const roleName = (roleId) => ROLE_NAMES[roleId] || null;

// Accepts 1/2 or "1"/"2"; returns the role id or null.
function toRoleId(value) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Object.values(ROLES).includes(n) ? n : null;
}

module.exports = { ROLES, ROLE_NAMES, roleName, toRoleId };
