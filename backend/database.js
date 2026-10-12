const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// --------------------------------------------------
// DATABASE LOCATION
// --------------------------------------------------

const dataDirectory = path.join(
  __dirname,
  "data"
);

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, {
    recursive: true,
  });
}

const databasePath = path.join(
  dataDirectory,
  "ev-smartcharge.db"
);

// --------------------------------------------------
// CREATE DATABASE
// --------------------------------------------------

const db = new Database(databasePath);

// Enable foreign-key support
db.pragma("foreign_keys = ON");

// --------------------------------------------------
// USERS TABLE
// --------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// --------------------------------------------------
// VEHICLES TABLE
// --------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    battery_capacity REAL NOT NULL,
    max_range REAL NOT NULL,
    connector_type TEXT NOT NULL,
    max_charging_speed REAL NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// --------------------------------------------------
// FAVORITES TABLE
// --------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    UNIQUE(user_id, station_id)
  );
`);

// --------------------------------------------------
// REVIEWS TABLE
// --------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,

    rating INTEGER NOT NULL
      CHECK(rating >= 1 AND rating <= 5),

    review TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// --------------------------------------------------
// TRIP HISTORY TABLE
// --------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS trip_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    start_location TEXT NOT NULL,
    destination TEXT NOT NULL,

    distance REAL NOT NULL DEFAULT 0,

    charging_stops INTEGER NOT NULL DEFAULT 0,

    charging_cost REAL NOT NULL DEFAULT 0,

    trip_time REAL NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// --------------------------------------------------
// DATABASE TEST
// --------------------------------------------------

const tables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
  `)
  .all();

console.log("=================================");
console.log("EV SmartCharge Database Ready");
console.log("=================================");
console.log("Database:", databasePath);
console.log(
  "Tables:",
  tables.map((table) => table.name).join(", ")
);
console.log("=================================");

// --------------------------------------------------
// EXPORT DATABASE
// --------------------------------------------------

module.exports = db;