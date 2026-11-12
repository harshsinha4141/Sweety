const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../../config/supabase");
const AppError = require("../../utils/AppError");
const { todayIn, isValidDateString } = require("../../utils/date");
const { ROLES, roleName, toRoleId } = require("../../utils/roles");

// bcrypt cost factor: 10 => 2^10 key-expansion rounds; a fresh random salt is generated per hash.
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPTIONAL_FIELDS = ["phone_number", "date_of_birth", "gender", "blood_group", "height_cm"];

// Columns that are safe to return to clients (never select password_hash here).
// `doctor` embeds the assigned doctor's public details via the users.assigned_doctor foreign key.
const PUBLIC_COLUMNS =
  "id, full_name, email, phone_number, date_of_birth, gender, blood_group, height_cm, role_id, assigned_doctor, created_at, updated_at, doctor:assigned_doctor(id, full_name, email)";

const GENDERS = ["female", "male", "other", "prefer_not_to_say"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/;

// Error carrying an HTTP status; the controller turns it into a response.
class AuthError extends AppError {}

/* ---------- helpers ---------- */

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

function generateToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email, role_id: user.role_id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Adds the role name ("patient" / "doctor") to a user row before it is returned.
const present = (user) => ({ ...user, role: roleName(user.role_id) });

// Positive integer id or null.
function toId(value) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Number.isInteger(n) && n > 0 ? n : null;
}

// A patient's assigned_doctor must point at an existing doctor account.
async function assertDoctorExists(doctorId) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", doctorId)
    .eq("role_id", ROLES.DOCTOR)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AuthError("Please choose a valid doctor", 400);
}

// Throws (JsonWebTokenError / TokenExpiredError) if invalid.
const verifyToken = (token) => jwt.verify(token, getJwtSecret());

/* ---------- validation ---------- */

// Returns a clean user object ready for insert (without password), or throws AuthError(400).
function validateRegisterInput(body = {}) {
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = normalizeEmail(body.email);
  const { password } = body;

  if (!full_name) throw new AuthError("Full name is required", 400);
  if (!EMAIL_REGEX.test(email)) throw new AuthError("A valid email is required", 400);
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }

  // Role is required for everyone; patients must also choose their doctor.
  const role_id = toRoleId(body.role_id);
  if (!role_id) throw new AuthError("Please choose whether you are a patient or a doctor", 400);

  let assigned_doctor = null;
  if (role_id === ROLES.PATIENT) {
    assigned_doctor = toId(body.assigned_doctor);
    if (!assigned_doctor) throw new AuthError("Please choose your doctor", 400);
  }

  const profile = { full_name, email, role_id, assigned_doctor };
  for (const field of OPTIONAL_FIELDS) {
    if (body[field] !== undefined && body[field] !== "" && body[field] !== null) profile[field] = body[field];
  }
  validateOptionalFields(profile);

  return { profile, password };
}

// Validates/normalizes optional profile fields present on `profile` (mutates it). null = cleared.
function validateOptionalFields(profile) {
  if (profile.height_cm != null) {
    const height = Number(profile.height_cm);
    if (!Number.isFinite(height) || height <= 0 || height >= 1000) {
      throw new AuthError("Height must be a positive number in cm", 400);
    }
    profile.height_cm = height;
  }
  if (profile.date_of_birth != null) {
    if (!isValidDateString(profile.date_of_birth)) {
      throw new AuthError("Date of birth must be a valid date (YYYY-MM-DD)", 400);
    }
    if (profile.date_of_birth > todayIn()) {
      throw new AuthError("Date of birth cannot be in the future", 400);
    }
  }
  if (profile.phone_number != null) {
    profile.phone_number = String(profile.phone_number).trim();
    if (!PHONE_REGEX.test(profile.phone_number)) {
      throw new AuthError("Please enter a valid phone number", 400);
    }
  }
  if (profile.gender != null && !GENDERS.includes(profile.gender)) {
    throw new AuthError(`Gender must be one of: ${GENDERS.join(", ")}`, 400);
  }
  if (profile.blood_group != null && !BLOOD_GROUPS.includes(profile.blood_group)) {
    throw new AuthError(`Blood group must be one of: ${BLOOD_GROUPS.join(", ")}`, 400);
  }
}

// Partial profile update. Optional fields sent as "" or null are cleared.
function validateProfileUpdate(body = {}) {
  const changes = {};

  if (body.full_name !== undefined) {
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
    if (!full_name) throw new AuthError("Full name is required", 400);
    changes.full_name = full_name;
  }
  if (body.email !== undefined) {
    const email = normalizeEmail(body.email);
    if (!EMAIL_REGEX.test(email)) throw new AuthError("A valid email is required", 400);
    changes.email = email;
  }
  for (const field of OPTIONAL_FIELDS) {
    if (body[field] === undefined) continue;
    changes[field] = body[field] === "" || body[field] === null ? null : body[field];
  }
  if (body.role_id !== undefined) throw new AuthError("Role can't be changed", 400);
  // Checked against the user's role (and the doctors table) in updateProfile.
  if (body.assigned_doctor !== undefined) changes.assigned_doctor = toId(body.assigned_doctor);

  if (!Object.keys(changes).length) throw new AuthError("No changes to save", 400);
  validateOptionalFields(changes);
  return changes;
}

function validateLoginInput(body = {}) {
  const email = normalizeEmail(body.email);
  const { password } = body;
  if (!email || typeof password !== "string" || !password) {
    throw new AuthError("Email and password are required", 400);
  }
  return { email, password };
}

/* ---------- data access ---------- */

async function findUserByEmailWithHash(email) {
  const { data, error } = await supabase
    .from("users")
    .select(`${PUBLIC_COLUMNS}, password_hash`)
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- use cases (called by the controller) ---------- */

async function registerUser(body) {
  const { profile, password } = validateRegisterInput(body);
  if (profile.role_id === ROLES.PATIENT) await assertDoctorExists(profile.assigned_doctor);
  const password_hash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({ ...profile, password_hash })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") throw new AuthError("Email is already registered", 409);
    throw error;
  }

  return { user: present(data), token: generateToken(data) };
}

async function loginUser(body) {
  const { email, password } = validateLoginInput(body);

  const record = await findUserByEmailWithHash(email);
  // Same message for unknown email and wrong password, so emails can't be enumerated.
  if (!record || !(await comparePassword(password, record.password_hash))) {
    throw new AuthError("Invalid email or password", 401);
  }

  const { password_hash, ...user } = record;
  return { user: present(user), token: generateToken(user) };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) throw new AuthError("User not found", 404);
  return present(user);
}

// GET /api/auth/me — also returns a fresh token when the caller's token carries a
// stale/missing role, so the client can move the user to the right area.
async function getSession(userId, tokenRoleId) {
  const user = await getCurrentUser(userId);
  return tokenRoleId === user.role_id ? { user } : { user, token: generateToken(user) };
}

// Used by the requireRole middleware (the DB is the source of truth for roles).
async function getRoleId(userId) {
  const { data, error } = await supabase.from("users").select("role_id").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AuthError("User not found", 404);
  return data.role_id;
}

// PUT /api/auth/me — returns a fresh token because the JWT carries the email.
async function updateProfile(userId, body) {
  const changes = validateProfileUpdate(body);

  // Only patients have a doctor, and it can be changed but never removed.
  if ("assigned_doctor" in changes) {
    if ((await getRoleId(userId)) !== ROLES.PATIENT) {
      throw new AuthError("Only patients can choose a doctor", 400);
    }
    if (!changes.assigned_doctor) throw new AuthError("Please choose your doctor", 400);
    await assertDoctorExists(changes.assigned_doctor);
  }

  const { data, error } = await supabase
    .from("users")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") throw new AuthError("Email is already registered", 409);
    throw error;
  }
  if (!data) throw new AuthError("User not found", 404);

  return { user: present(data), token: generateToken(data) };
}

// PUT /api/auth/password
async function changePassword(userId, body = {}) {
  const { current_password, new_password } = body;
  if (typeof current_password !== "string" || !current_password) {
    throw new AuthError("Current password is required", 400);
  }
  if (typeof new_password !== "string" || new_password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }

  const { data: record, error } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!record) throw new AuthError("User not found", 404);

  // 400 (not 401) so the client doesn't treat it as an expired session.
  if (!(await comparePassword(current_password, record.password_hash))) {
    throw new AuthError("Current password is incorrect", 400);
  }
  if (await comparePassword(new_password, record.password_hash)) {
    throw new AuthError("New password must be different from the current password", 400);
  }

  const password_hash = await hashPassword(new_password);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (updateError) throw updateError;

  return null;
}

module.exports = {
  AuthError,
  getSession,
  verifyToken,
  registerUser,
  loginUser,
  getCurrentUser,
  getRoleId,
  updateProfile,
  changePassword,
};
