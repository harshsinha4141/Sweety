const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../../config/supabase");

// bcrypt cost factor: 10 => 2^10 key-expansion rounds; a fresh random salt is generated per hash.
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPTIONAL_FIELDS = ["phone_number", "date_of_birth", "gender", "blood_group", "height_cm"];

// Columns that are safe to return to clients (never select password_hash here).
const PUBLIC_COLUMNS =
  "id, full_name, email, phone_number, date_of_birth, gender, blood_group, height_cm, created_at, updated_at";

// Error carrying an HTTP status; the controller turns it into a response.
class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

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
    if (body[field] !== undefined && body[field] !== "") profile[field] = body[field];
  }

  if (profile.height_cm !== undefined) {
    const height = Number(profile.height_cm);
    if (!Number.isFinite(height) || height <= 0 || height >= 1000) {
      throw new AuthError("Height must be a positive number in cm", 400);
    }
    profile.height_cm = height;
  }
  if (profile.date_of_birth !== undefined && Number.isNaN(Date.parse(profile.date_of_birth))) {
    throw new AuthError("Date of birth must be a valid date (YYYY-MM-DD)", 400);
  }

  return { profile, password };
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

module.exports = {
  AuthError,
  verifyToken,
  registerUser,
  loginUser,
  getCurrentUser,
};
