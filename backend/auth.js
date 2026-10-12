const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./database");

// --------------------------------------------------
// JWT SECRET
// --------------------------------------------------

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "ev-smartcharge-development-secret";

// --------------------------------------------------
// CREATE USER
// --------------------------------------------------

async function createUser({
  name,
  email,
  password,
}) {
  const cleanName = name.trim();
  const normalizedEmail =
    email.trim().toLowerCase();

  // Check whether email already exists
  const existingUser = db
    .prepare(
      `
        SELECT id
        FROM users
        WHERE email = ?
      `
    )
    .get(normalizedEmail);

  if (existingUser) {
    throw new Error(
      "An account with this email already exists."
    );
  }

  // Hash password
  const passwordHash =
    await bcrypt.hash(password, 10);

  // Insert user
  const result = db
    .prepare(
      `
        INSERT INTO users
        (
          name,
          email,
          password_hash
        )
        VALUES (?, ?, ?)
      `
    )
    .run(
      cleanName,
      normalizedEmail,
      passwordHash
    );

  // Return newly created user
  const newUser = db
    .prepare(
      `
        SELECT
          id,
          name,
          email,
          created_at
        FROM users
        WHERE id = ?
      `
    )
    .get(result.lastInsertRowid);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.created_at,
  };
}

// --------------------------------------------------
// AUTHENTICATE USER
// --------------------------------------------------

async function authenticateUser({
  email,
  password,
}) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user = db
    .prepare(
      `
        SELECT
          id,
          name,
          email,
          password_hash,
          created_at
        FROM users
        WHERE email = ?
      `
    )
    .get(normalizedEmail);

  if (!user) {
    throw new Error(
      "Invalid email or password."
    );
  }

  // Compare entered password
  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password_hash
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid email or password."
    );
  }

  return sanitizeUser(user);
}

// --------------------------------------------------
// SANITIZE USER
// --------------------------------------------------

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt:
      user.createdAt ||
      user.created_at,
  };
}

// --------------------------------------------------
// GENERATE JWT TOKEN
// --------------------------------------------------

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// --------------------------------------------------
// VERIFY JWT TOKEN
// --------------------------------------------------

function verifyToken(token) {
  return jwt.verify(
    token,
    JWT_SECRET
  );
}

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

function authenticateToken(
  req,
  res,
  next
) {
  const authorization =
    req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  const token =
    authorization.substring(7);

  try {
    const decoded =
      verifyToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token.",
    });
  }
}

// --------------------------------------------------
// GET USER BY ID
// --------------------------------------------------

function getUserById(userId) {
  const user = db
    .prepare(
      `
        SELECT
          id,
          name,
          email,
          created_at
        FROM users
        WHERE id = ?
      `
    )
    .get(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = {
  createUser,
  authenticateUser,
  generateToken,
  verifyToken,
  authenticateToken,
  sanitizeUser,
  getUserById,
};