const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(
  __dirname,
  "data",
  "ev-smartcharge-userdata.db"
);

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");


/* =========================================================
   DATABASE TABLES
   ========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    station_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, station_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    station_id TEXT NOT NULL,
    rating INTEGER NOT NULL
      CHECK(rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trip_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    source TEXT,
    destination TEXT,
    distance_km REAL,
    duration_minutes REAL,
    vehicle_id TEXT,
    battery_start REAL,
    arrival_battery REAL,
    number_of_stops INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    total_energy REAL DEFAULT 0,
    total_charging_time REAL DEFAULT 0,
    route_complete INTEGER DEFAULT 0,
    trip_data TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicle_settings (
    user_id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    battery REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================================================
   FAVORITES
   ========================================================= */

function listFavorites(userId) {

  return db
    .prepare(`
      SELECT
        id,
        station_id AS stationId,
        created_at AS createdAt
      FROM favorites
      WHERE user_id = ?
      ORDER BY
        datetime(created_at) DESC,
        id DESC
    `)
    .all(userId);
}


function addFavorite(
  userId,
  stationId
) {

  db
    .prepare(`
      INSERT OR IGNORE INTO favorites
      (
        user_id,
        station_id
      )
      VALUES (?, ?)
    `)
    .run(
      userId,
      stationId
    );


  return db
    .prepare(`
      SELECT
        id,
        station_id AS stationId,
        created_at AS createdAt
      FROM favorites
      WHERE
        user_id = ?
        AND station_id = ?
    `)
    .get(
      userId,
      stationId
    );
}


function removeFavorite(
  userId,
  stationId
) {

  return db
    .prepare(`
      DELETE FROM favorites
      WHERE
        user_id = ?
        AND station_id = ?
    `)
    .run(
      userId,
      stationId
    )
    .changes;
}


function clearFavorites(
  userId
) {

  return db
    .prepare(`
      DELETE FROM favorites
      WHERE user_id = ?
    `)
    .run(userId)
    .changes;
}


/* =========================================================
   REVIEWS
   ========================================================= */

function listReviews(
  stationId
) {

  return db
    .prepare(`
      SELECT
        id,
        user_id AS userId,
        user_name AS userName,
        station_id AS stationId,
        rating,
        comment,
        created_at AS createdAt
      FROM reviews
      WHERE station_id = ?
      ORDER BY
        datetime(created_at) DESC,
        id DESC
    `)
    .all(stationId);
}


function addReview({
  userId,
  stationId,
  rating,
  comment,
  userName
}) {

  const result =
    db
      .prepare(`
        INSERT INTO reviews
        (
          user_id,
          user_name,
          station_id,
          rating,
          comment
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        userId,
        userName || "EV Driver",
        stationId,
        rating,
        comment
      );


  return db
    .prepare(`
      SELECT
        id,
        user_id AS userId,
        user_name AS userName,
        station_id AS stationId,
        rating,
        comment,
        created_at AS createdAt
      FROM reviews
      WHERE id = ?
    `)
    .get(
      result.lastInsertRowid
    );
}


function removeReview(
  reviewId,
  userId
) {

  return db
    .prepare(`
      DELETE FROM reviews
      WHERE
        id = ?
        AND user_id = ?
    `)
    .run(
      reviewId,
      userId
    )
    .changes;
}


/* =========================================================
   TRIP HISTORY
   ========================================================= */

function listTripHistory(
  userId
) {

  return db
    .prepare(`
      SELECT
        id,
        source,
        destination,
        distance_km AS distanceKm,
        duration_minutes AS durationMinutes,
        vehicle_id AS vehicleId,
        battery_start AS batteryStart,
        arrival_battery AS arrivalBattery,
        number_of_stops AS numberOfStops,
        total_cost AS totalCost,
        total_energy AS totalEnergy,
        total_charging_time AS totalChargingTime,
        route_complete AS routeComplete,
        trip_data AS tripData,
        created_at AS createdAt
      FROM trip_history
      WHERE user_id = ?
      ORDER BY
        datetime(created_at) DESC,
        id DESC
    `)
    .all(userId)
    .map((trip) => {

      let parsedTripData = null;

      try {

        parsedTripData =
          trip.tripData
            ? JSON.parse(
                trip.tripData
              )
            : null;

      } catch (error) {

        parsedTripData = null;

      }


      return {
        ...trip,

        routeComplete:
          Boolean(
            trip.routeComplete
          ),

        tripData:
          parsedTripData,
      };

    });
}


function addTripHistory(
  userId,
  data
) {

  const source =
    String(
      data.source || ""
    ).trim();

  const destination =
    String(
      data.destination || ""
    ).trim();


  if (
    !source ||
    !destination
  ) {

    throw new Error(
      "Source and destination are required."
    );

  }


  const result =
    db
      .prepare(`
        INSERT INTO trip_history
        (
          user_id,
          source,
          destination,
          distance_km,
          duration_minutes,
          vehicle_id,
          battery_start,
          arrival_battery,
          number_of_stops,
          total_cost,
          total_energy,
          total_charging_time,
          route_complete,
          trip_data
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(

        userId,

        source,

        destination,

        Number.isFinite(
          Number(
            data.distanceKm
          )
        )
          ? Number(
              data.distanceKm
            )
          : null,

        Number.isFinite(
          Number(
            data.durationMinutes
          )
        )
          ? Number(
              data.durationMinutes
            )
          : null,

        data.vehicleId == null
          ? null
          : String(
              data.vehicleId
            ),

        Number.isFinite(
          Number(
            data.batteryStart
          )
        )
          ? Number(
              data.batteryStart
            )
          : null,

        Number.isFinite(
          Number(
            data.arrivalBattery
          )
        )
          ? Number(
              data.arrivalBattery
            )
          : null,

        Number.isFinite(
          Number(
            data.numberOfStops
          )
        )
          ? Number(
              data.numberOfStops
            )
          : 0,

        Number.isFinite(
          Number(
            data.totalCost
          )
        )
          ? Number(
              data.totalCost
            )
          : 0,

        Number.isFinite(
          Number(
            data.totalEnergy
          )
        )
          ? Number(
              data.totalEnergy
            )
          : 0,

        Number.isFinite(
          Number(
            data.totalChargingTime
          )
        )
          ? Number(
              data.totalChargingTime
            )
          : 0,

        data.routeComplete
          ? 1
          : 0,

        JSON.stringify(
          data.tripData || data
        )
      );


  return db
    .prepare(`
      SELECT
        id,
        source,
        destination,
        distance_km AS distanceKm,
        duration_minutes AS durationMinutes,
        vehicle_id AS vehicleId,
        battery_start AS batteryStart,
        arrival_battery AS arrivalBattery,
        number_of_stops AS numberOfStops,
        total_cost AS totalCost,
        total_energy AS totalEnergy,
        total_charging_time AS totalChargingTime,
        route_complete AS routeComplete,
        trip_data AS tripData,
        created_at AS createdAt
      FROM trip_history
      WHERE id = ?
    `)
    .get(
      result.lastInsertRowid
    );
}


function removeTripHistory(
  tripId,
  userId
) {

  return db
    .prepare(`
      DELETE FROM trip_history
      WHERE
        id = ?
        AND user_id = ?
    `)
    .run(
      tripId,
      userId
    )
    .changes;
}


function clearTripHistory(
  userId
) {

  return db
    .prepare(`
      DELETE FROM trip_history
      WHERE user_id = ?
    `)
    .run(userId)
    .changes;
}


/* =========================================================
   VEHICLE SETTINGS
   ========================================================= */

function getVehicleSettings(
  userId
) {

  return (
    db
      .prepare(`
        SELECT
          vehicle_id AS vehicleId,
          battery,
          updated_at AS updatedAt
        FROM vehicle_settings
        WHERE user_id = ?
      `)
      .get(userId) || null
  );
}


function saveVehicleSettings(
  userId,
  {
    vehicleId,
    battery
  }
) {

  db
    .prepare(`
      INSERT INTO vehicle_settings
      (
        user_id,
        vehicle_id,
        battery,
        updated_at
      )
      VALUES
      (?, ?, ?, CURRENT_TIMESTAMP)

      ON CONFLICT(user_id)
      DO UPDATE SET

        vehicle_id =
          excluded.vehicle_id,

        battery =
          excluded.battery,

        updated_at =
          CURRENT_TIMESTAMP
    `)
    .run(
      userId,
      vehicleId,
      battery
    );


  return getVehicleSettings(
    userId
  );
}


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {

  listFavorites,
  addFavorite,
  removeFavorite,
  clearFavorites,

  listReviews,
  addReview,
  removeReview,

  listTripHistory,
  addTripHistory,
  removeTripHistory,
  clearTripHistory,

  getVehicleSettings,
  saveVehicleSettings,

};