const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../../config/supabase");
const AppError = require("../../utils/AppError");
const { todayIn, isValidDateString } = require("../../utils/date");

// bcrypt cost factor: 10 => 2^10 key-expansion rounds; a fresh random salt is generated per hash.
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPTIONAL_FIELDS = ["phone_number", "date_of_birth", "gender", "blood_group", "height_cm"];

// Columns that are safe to return to clients (never select password_hash here).
const PUBLIC_COLUMNS =
  "id, full_name, email, phone_number, date_of_birth, gender, blood_group, height_cm, created_at, updated_at";

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
  return jwt.sign({ sub: String(user.id), email: user.email }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
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

  const profile = { full_name, email };
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

  return { user: data, token: generateToken(data) };
}

async function loginUser(body) {
  const { email, password } = validateLoginInput(body);

  const record = await findUserByEmailWithHash(email);
  // Same message for unknown email and wrong password, so emails can't be enumerated.
  if (!record || !(await comparePassword(password, record.password_hash))) {
    throw new AuthError("Invalid email or password", 401);
  }

  const { password_hash, ...user } = record;
  return { user, token: generateToken(user) };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) throw new AuthError("User not found", 404);
  return user;
}

// PUT /api/auth/me — returns a fresh token because the JWT carries the email.
async function updateProfile(userId, body) {
  const changes = validateProfileUpdate(body);

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

  return { user: data, token: generateToken(data) };
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
  verifyToken,
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
};
