const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const {
  calculateDistance,
  calculateRemainingRange,
  checkReachability,
  checkConnectorCompatibility,
  calculateScore,
} = require("./recommendation");

const {
  createUser,
  authenticateUser,
  generateToken,
  authenticateToken,
  getUserById,
} = require("./auth");

const {
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
} = require("./userData");


/* =========================================================
   APP CONFIGURATION
   ========================================================= */

const app = express();

const PORT = 3000;


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());


/* =========================================================
   DATA FILES
   ========================================================= */

const stationsPath = path.join(
  __dirname,
  "data",
  "stations.json"
);

const vehiclesPath = path.join(
  __dirname,
  "data",
  "vehicles.json"
);


/* =========================================================
   DATA LOADERS
   ========================================================= */

function loadStations() {
  return JSON.parse(
    fs.readFileSync(
      stationsPath,
      "utf8"
    )
  );
}


function loadVehicles() {
  return JSON.parse(
    fs.readFileSync(
      vehiclesPath,
      "utf8"
    )
  );
}


/* =========================================================
   BASIC ROUTES
   ========================================================= */

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message: "EV SmartCharge API is running",
      version: "1.0.0",
    });
  }
);


app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      status: "healthy",
      service: "EV SmartCharge Backend",
    });
  }
);


/* =========================================================
   AUTHENTICATION
   ========================================================= */

app.post(
  "/api/auth/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body || {};

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      const cleanName = name.trim();

      const cleanEmail = email
        .trim()
        .toLowerCase();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Name is required.",
        });
      }

      if (
        !cleanEmail ||
        !cleanEmail.includes("@")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      const user = await createUser({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message:
          "Account created successfully.",
        token,
        user,
      });

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to create account.",
      });
    }
  }
);


app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body || {};

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const user =
        await authenticateUser({
          email: email.trim(),
          password,
        });

      const token =
        generateToken(user);

      res.json({
        success: true,
        message:
          "Login successful.",
        token,
        user,
      });

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      res.status(401).json({
        success: false,
        message:
          error.message ||
          "Invalid email or password.",
      });
    }
  }
);


app.get(
  "/api/auth/me",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user ID is missing.",
        });
      }

      const user =
        getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      res.json({
        success: true,
        user,
      });

    } catch (error) {
      console.error(
        "Authentication check error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to verify account.",
      });
    }
  }
);


/* =========================================================
   AUTHENTICATED USER ID HELPER
   ========================================================= */

/*
   Different JWT implementations may store the user ID as:

   req.user.id
   req.user.userId
   req.user.sub

   This helper supports all three.
*/

function getAuthenticatedUserId(req) {
  if (!req || !req.user) {
    return null;
  }

  const possibleId =
    req.user.id ??
    req.user.userId ??
    req.user.sub;

  if (
    possibleId === undefined ||
    possibleId === null ||
    String(possibleId).trim() === ""
  ) {
    return null;
  }

  return String(possibleId);
}


function requireUserId(req, res) {
  const userId =
    getAuthenticatedUserId(req);

  if (!userId) {
    res.status(401).json({
      success: false,
      message:
        "Authentication required. User ID was not found.",
    });

    return null;
  }

  return userId;
}


/* =========================================================
   VEHICLES
   ========================================================= */

app.get(
  "/api/vehicles",
  (req, res) => {
    try {
      const vehicles =
        loadVehicles();

      res.json(vehicles);

    } catch (error) {
      console.error(
        "Vehicle loading error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to load vehicle data.",
      });
    }
  }
);


app.get(
  "/api/vehicles/:id",
  (req, res) => {
    try {
      const vehicles =
        loadVehicles();

      const vehicle =
        vehicles.find(
          (item) =>
            String(item.id) ===
            String(req.params.id)
        );

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error:
            "Vehicle not found.",
        });
      }

      res.json(vehicle);

    } catch (error) {
      console.error(
        "Vehicle error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to load vehicle.",
      });
    }
  }
);


/* =========================================================
   ALL STATIONS
   ========================================================= */

app.get(
  "/api/stations",
  (req, res) => {
    try {
      const stations =
        loadStations();

      res.json(stations);

    } catch (error) {
      console.error(
        "Station loading error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to load station data.",
      });
    }
  }
);


/* =========================================================
   NEARBY STATION RECOMMENDATION
   ========================================================= */

app.get(
  "/api/stations/nearby",
  (req, res) => {
    try {
      const {
        latitude,
        longitude,
        battery,
        maxRange,
        connector,
      } = req.query;

      const userLatitude =
        Number(latitude);

      const userLongitude =
        Number(longitude);

      const batteryPercentage =
        Number(battery);

      const vehicleMaxRange =
        Number(maxRange);

      if (
        !Number.isFinite(userLatitude) ||
        !Number.isFinite(userLongitude)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid latitude and longitude are required.",
        });
      }

      if (
        !Number.isFinite(
          batteryPercentage
        ) ||
        batteryPercentage < 0 ||
        batteryPercentage > 100
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Battery must be between 0 and 100.",
        });
      }

      if (
        !Number.isFinite(
          vehicleMaxRange
        ) ||
        vehicleMaxRange <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid vehicle range is required.",
        });
      }

      if (!connector) {
        return res.status(400).json({
          success: false,
          error:
            "Vehicle connector type is required.",
        });
      }

      const stations =
        loadStations();

      const remainingRange =
        calculateRemainingRange(
          batteryPercentage,
          vehicleMaxRange
        );

      const analyzedStations =
        stations.map(
          (station) => {
            const distance =
              calculateDistance(
                userLatitude,
                userLongitude,
                Number(
                  station.latitude
                ),
                Number(
                  station.longitude
                )
              );

            const connectorCompatible =
              checkConnectorCompatibility(
                connector,
                station.connectors
              );

            const reachability =
              checkReachability(
                distance,
                remainingRange
              );

            const score =
              calculateScore({
                distance,
                maxDistance: 25,
                available:
                  Number(
                    station.availableChargers
                  ),
                total:
                  Number(
                    station.totalChargers
                  ),
                waitingTime:
                  Number(
                    station.waitingTime
                  ),
                chargingSpeed:
                  Number(
                    station.chargingSpeed
                  ),
                pricePerKwh:
                  Number(
                    station.pricePerKwh
                  ),
                rating:
                  Number(
                    station.rating
                  ),
              });

            const usable =
              connectorCompatible &&
              reachability.status !==
                "UNREACHABLE" &&
              station.fault !== true &&
              station.open !== false &&
              Number(
                station.availableChargers
              ) > 0;

            return {
              ...station,

              distance:
                Number(
                  distance.toFixed(2)
                ),

              connectorCompatible,

              reachability,

              score:
                usable
                  ? Number(
                      score.toFixed(2)
                    )
                  : 0,

              usable,
            };
          }
        );

      analyzedStations.sort(
        (a, b) =>
          b.score - a.score
      );

      const recommendedStation =
        analyzedStations.find(
          (station) =>
            station.usable
        ) || null;

      const validStationCount =
        analyzedStations.filter(
          (station) =>
            station.usable
        ).length;

      res.json({
        success: true,

        vehicle: {
          battery:
            batteryPercentage,

          maxRange:
            vehicleMaxRange,

          remainingRange:
            Number(
              remainingRange.toFixed(2)
            ),

          connector,
        },

        recommendedStation,

        count:
          analyzedStations.length,

        validStationCount,

        allStations:
          analyzedStations,
      });

    } catch (error) {
      console.error(
        "Nearby station error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to analyze charging stations.",
      });
    }
  }
);


/* =========================================================
   CHARGING CALCULATOR
   ========================================================= */

app.get(
  "/api/charging-calculator",
  (req, res) => {
    try {
      const {
        battery,
        targetBattery,
        batteryCapacity,
        chargingSpeed,
        pricePerKwh,
      } = req.query;

      const currentBattery =
        Number(battery);

      const target =
        Number(targetBattery);

      const capacity =
        Number(batteryCapacity);

      const chargerPower =
        Number(chargingSpeed);

      const price =
        Number(pricePerKwh);

      if (
        !Number.isFinite(
          currentBattery
        ) ||
        !Number.isFinite(
          target
        ) ||
        !Number.isFinite(
          capacity
        ) ||
        !Number.isFinite(
          chargerPower
        ) ||
        !Number.isFinite(
          price
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "All charging calculation values are required.",
        });
      }

      if (
        target <= currentBattery
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Target battery must be greater than current battery.",
        });
      }

      if (
        capacity <= 0 ||
        chargerPower <= 0 ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Battery capacity, charging speed and price must be valid.",
        });
      }

      const energyRequired =
        (
          (
            target -
            currentBattery
          ) / 100
        ) * capacity;

      const chargingEfficiency =
        0.9;

      const gridEnergy =
        energyRequired /
        chargingEfficiency;

      const chargingTimeHours =
        gridEnergy /
        chargerPower;

      const chargingTimeMinutes =
        chargingTimeHours * 60;

      const estimatedCost =
        gridEnergy * price;

      res.json({
        success: true,

        currentBattery,

        targetBattery:
          target,

        batteryCapacity:
          capacity,

        energyRequired:
          Number(
            energyRequired.toFixed(2)
          ),

        gridEnergy:
          Number(
            gridEnergy.toFixed(2)
          ),

        chargingTimeMinutes:
          Number(
            chargingTimeMinutes.toFixed(1)
          ),

        estimatedCost:
          Number(
            estimatedCost.toFixed(2)
          ),

        chargingEfficiency:
          chargingEfficiency * 100,
      });

    } catch (error) {
      console.error(
        "Charging calculator error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to calculate charging details.",
      });
    }
  }
);


/* =========================================================
   GEOCODING
   ========================================================= */

app.get(
  "/api/geocode",
  async (req, res) => {
    try {
      const query =
        String(
          req.query.query || ""
        ).trim();

      if (!query) {
        return res.status(400).json({
          success: false,
          error:
            "Location search text is required.",
        });
      }

      const url =
        "https://nominatim.openstreetmap.org/search?" +
        "format=json&limit=5&addressdetails=1&" +
        `q=${encodeURIComponent(query)}`;

      const response =
        await fetch(
          url,
          {
            headers: {
              "User-Agent":
                "EV-SmartCharge/1.0",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          `Geocoding service returned ${response.status}`
        );
      }

      const results =
        await response.json();

      const formattedResults =
        results.map(
          (item) => ({
            latitude:
              Number(item.lat),

            longitude:
              Number(item.lon),

            name:
              item.name ||
              item.display_name
                ?.split(",")[0] ||
              "Location",

            displayName:
              item.display_name,
          })
        );

      res.json({
        success: true,
        results:
          formattedResults,
      });

    } catch (error) {
      console.error(
        "Geocoding error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to search location.",
      });
    }
  }
);


/* =========================================================
   ROUTE CALCULATION
   ========================================================= */

app.get(
  "/api/route",
  async (req, res) => {
    try {
      const {
        startLat,
        startLon,
        endLat,
        endLon,
      } = req.query;

      const startLatitude =
        Number(startLat);

      const startLongitude =
        Number(startLon);

      const endLatitude =
        Number(endLat);

      const endLongitude =
        Number(endLon);

      if (
        !Number.isFinite(
          startLatitude
        ) ||
        !Number.isFinite(
          startLongitude
        ) ||
        !Number.isFinite(
          endLatitude
        ) ||
        !Number.isFinite(
          endLongitude
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid start and destination coordinates are required.",
        });
      }

      const coordinates =
        `${startLongitude},${startLatitude};` +
        `${endLongitude},${endLatitude}`;

      const url =
        `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
        "?overview=full&geometries=geojson";

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Routing service returned ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        data.code !== "Ok" ||
        !data.routes ||
        data.routes.length === 0
      ) {
        return res.status(404).json({
          success: false,
          error:
            "Unable to calculate a driving route.",
        });
      }

      const route =
        data.routes[0];

      res.json({
        success: true,

        distanceKm:
          Number(
            (
              route.distance /
              1000
            ).toFixed(2)
          ),

        durationMinutes:
          Number(
            (
              route.duration /
              60
            ).toFixed(1)
          ),

        geometry:
          route.geometry,

        source:
          "OSRM",
      });

    } catch (error) {
      console.error(
        "Routing error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to calculate route.",
      });
    }
  }
);


/* =========================================================
   FIND STATIONS NEAR ROUTE
   ========================================================= */

function findStationsNearRoute(
  routeCoordinates,
  stations,
  connector,
  maxDistanceFromRouteKm = 15
) {
  const candidates = [];

  for (
    const station of stations
  ) {
    if (
      station.latitude ===
        undefined ||
      station.longitude ===
        undefined
    ) {
      continue;
    }

    if (
      station.open === false ||
      station.fault === true
    ) {
      continue;
    }

    if (
      Number(
        station.availableChargers || 0
      ) <= 0
    ) {
      continue;
    }

    if (
      !checkConnectorCompatibility(
        connector,
        station.connectors
      )
    ) {
      continue;
    }

    let closestDistance =
      Infinity;

    let routePosition =
      0;

    for (
      let i = 0;
      i < routeCoordinates.length;
      i++
    ) {
      const point =
        routeCoordinates[i];

      const longitude =
        Number(point[0]);

      const latitude =
        Number(point[1]);

      const distance =
        calculateDistance(
          latitude,
          longitude,
          Number(
            station.latitude
          ),
          Number(
            station.longitude
          )
        );

      if (
        distance <
        closestDistance
      ) {
        closestDistance =
          distance;

        routePosition =
          i /
          Math.max(
            routeCoordinates.length - 1,
            1
          );
      }
    }

    if (
      closestDistance <=
      maxDistanceFromRouteKm
    ) {
      candidates.push({
        ...station,

        distanceFromRoute:
          Number(
            closestDistance.toFixed(2)
          ),

        routePosition,
      });
    }
  }

  return candidates.sort(
    (a, b) =>
      a.routePosition -
      b.routePosition
  );
}


/* =========================================================
   LONG TRIP PLANNER
   ========================================================= */

app.get(
  "/api/trip-plan",
  async (req, res) => {
    try {
      const {
        startLat,
        startLon,
        endLat,
        endLon,
        battery,
        maxRange,
        connector,
        batteryCapacity,
        maxChargingSpeed,
      } = req.query;

      const startLatitude =
        Number(startLat);

      const startLongitude =
        Number(startLon);

      const destinationLatitude =
        Number(endLat);

      const destinationLongitude =
        Number(endLon);

      const currentBattery =
        Number(battery);

      const vehicleMaxRange =
        Number(maxRange);

      const capacity =
        Number(batteryCapacity);

      const vehicleMaxChargingSpeed =
        Number(maxChargingSpeed);

      if (
        !Number.isFinite(
          startLatitude
        ) ||
        !Number.isFinite(
          startLongitude
        ) ||
        !Number.isFinite(
          destinationLatitude
        ) ||
        !Number.isFinite(
          destinationLongitude
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid start and destination coordinates are required.",
        });
      }

      if (
        !Number.isFinite(
          currentBattery
        ) ||
        currentBattery < 0 ||
        currentBattery > 100
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Battery must be between 0 and 100.",
        });
      }

      if (
        !Number.isFinite(
          vehicleMaxRange
        ) ||
        vehicleMaxRange <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid vehicle range is required.",
        });
      }

      if (
        !Number.isFinite(
          capacity
        ) ||
        capacity <= 0
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid battery capacity is required.",
        });
      }

      if (!connector) {
        return res.status(400).json({
          success: false,
          error:
            "Connector type is required.",
        });
      }


      /* -----------------------------------------------------
         GET DRIVING ROUTE
         ----------------------------------------------------- */

      const coordinates =
        `${startLongitude},${startLatitude};` +
        `${destinationLongitude},${destinationLatitude}`;

      const routeUrl =
        `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
        "?overview=full&geometries=geojson";

      const routeResponse =
        await fetch(routeUrl);

      if (!routeResponse.ok) {
        throw new Error(
          "Unable to contact routing service."
        );
      }

      const routeData =
        await routeResponse.json();

      if (
        routeData.code !== "Ok" ||
        !routeData.routes ||
        routeData.routes.length === 0
      ) {
        return res.status(404).json({
          success: false,
          error:
            "No driving route could be found.",
        });
      }

      const route =
        routeData.routes[0];

      const routeDistanceKm =
        route.distance / 1000;

      const routeDurationMinutes =
        route.duration / 60;

      const routeCoordinates =
        route.geometry?.coordinates ||
        [];


      /* -----------------------------------------------------
         VEHICLE RANGE
         ----------------------------------------------------- */

      const initialRange =
        (
          currentBattery /
          100
        ) *
        vehicleMaxRange;

      const safetyReserve =
        initialRange * 0.15;

      const usableRange =
        initialRange -
        safetyReserve;


      /* -----------------------------------------------------
         TRIP WITHOUT CHARGING
         ----------------------------------------------------- */

      if (
        routeDistanceKm <=
        usableRange
      ) {
        const estimatedArrivalBattery =
          Math.max(
            0,
            currentBattery -
              (
                routeDistanceKm /
                vehicleMaxRange
              ) *
              100
          );

        return res.json({
          success: true,

          route: {
            distanceKm:
              Number(
                routeDistanceKm.toFixed(2)
              ),

            durationMinutes:
              Number(
                routeDurationMinutes.toFixed(1)
              ),

            geometry:
              route.geometry,
          },

          safety: {
            initialBattery:
              currentBattery,

            initialRangeKm:
              Number(
                initialRange.toFixed(2)
              ),

            safetyReserveKm:
              Number(
                safetyReserve.toFixed(2)
              ),

            usableRangeKm:
              Number(
                usableRange.toFixed(2)
              ),
          },

          chargingStops: [],

          stationCount:
            loadStations().length,

          summary: {
            numberOfStops: 0,

            totalChargingCost: 0,

            totalEnergyRequired: 0,

            totalChargingTimeMinutes: 0,

            estimatedArrivalBattery:
              Number(
                estimatedArrivalBattery.toFixed(1)
              ),

            routeComplete: true,

            message:
              "Your current battery is sufficient for the entire journey with the recommended safety reserve.",
          },
        });
      }


      /* -----------------------------------------------------
         FIND COMPATIBLE STATIONS
         ----------------------------------------------------- */

      const stations =
        loadStations();

      const routeStations =
        findStationsNearRoute(
          routeCoordinates,
          stations,
          connector,
          15
        );


      /* -----------------------------------------------------
         SELECT CHARGING STOPS
         ----------------------------------------------------- */

      const chargingStops = [];

      let batteryAtStart =
        currentBattery;

      let estimatedDistance =
        0;

      const targetChargeLevel =
        80;

      for (
        const station of routeStations
      ) {
        const stationRouteDistance =
          routeDistanceKm *
          station.routePosition;

        if (
          stationRouteDistance <=
          estimatedDistance
        ) {
          continue;
        }

        const distanceToStation =
          stationRouteDistance -
          estimatedDistance;

        const currentRange =
          (
            batteryAtStart /
            100
          ) *
          vehicleMaxRange;

        const currentUsableRange =
          currentRange * 0.85;

        if (
          distanceToStation >
          currentUsableRange
        ) {
          continue;
        }

        const remainingDistance =
          routeDistanceKm -
          stationRouteDistance;

        const targetRange =
          (
            targetChargeLevel /
            100
          ) *
          vehicleMaxRange;

        const targetUsableRange =
          targetRange * 0.85;

        if (
          remainingDistance <=
            targetUsableRange &&
          chargingStops.length > 0
        ) {
          continue;
        }

        const arrivalBattery =
          Math.max(
            0,
            batteryAtStart -
              (
                distanceToStation /
                vehicleMaxRange
              ) *
              100
          );

        const energyRequired =
          (
            (
              targetChargeLevel -
              arrivalBattery
            ) / 100
          ) *
          capacity;

        const efficiency =
          0.9;

        const gridEnergy =
          energyRequired /
          efficiency;

        let chargerPower =
          Number(
            station.chargingSpeed ||
            vehicleMaxChargingSpeed ||
            50
          );

        if (
          Number.isFinite(
            vehicleMaxChargingSpeed
          ) &&
          vehicleMaxChargingSpeed > 0
        ) {
          chargerPower =
            Math.min(
              chargerPower,
              vehicleMaxChargingSpeed
            );
        }

        const chargingTimeMinutes =
          chargerPower > 0
            ? (
                gridEnergy /
                chargerPower
              ) * 60
            : 0;

        const estimatedCost =
          gridEnergy *
          Number(
            station.pricePerKwh || 0
          );

        chargingStops.push({
          stationId:
            station.id,

          sequence:
            chargingStops.length + 1,

          stationName:
            station.name,

          location:
            station.location,

          latitude:
            station.latitude,

          longitude:
            station.longitude,

          rating:
            station.rating,

          routePosition:
            Number(
              station.routePosition.toFixed(3)
            ),

          distanceFromRoute:
            station.distanceFromRoute,

          arrivalBattery:
            Number(
              arrivalBattery.toFixed(1)
            ),

          chargeTo:
            targetChargeLevel,

          chargingSpeed:
            chargerPower,

          chargingTimeMinutes:
            Number(
              chargingTimeMinutes.toFixed(1)
            ),

          estimatedCost:
            Number(
              estimatedCost.toFixed(2)
            ),

          waitingTime:
            station.waitingTime,

          availableChargers:
            station.availableChargers,

          totalChargers:
            station.totalChargers,

          connectors:
            station.connectors,
        });

        batteryAtStart =
          targetChargeLevel;

        estimatedDistance =
          stationRouteDistance;

        if (
          routeDistanceKm -
            estimatedDistance <=
          targetUsableRange
        ) {
          break;
        }
      }


      /* -----------------------------------------------------
         CHECK ROUTE COMPLETION
         ----------------------------------------------------- */

      let routeComplete =
        false;

      let finalBattery =
        batteryAtStart;

      if (
        chargingStops.length === 0
      ) {
        routeComplete = false;

      } else {
        const lastStop =
          chargingStops[
            chargingStops.length - 1
          ];

        const remainingDistance =
          routeDistanceKm -
          (
            routeDistanceKm *
            lastStop.routePosition
          );

        finalBattery =
          Math.max(
            0,
            targetChargeLevel -
              (
                remainingDistance /
                vehicleMaxRange
              ) *
              100
          );

        routeComplete =
          remainingDistance <=
          (
            vehicleMaxRange *
            0.85
          );
      }


      /* -----------------------------------------------------
         TOTALS
         ----------------------------------------------------- */

      const totalChargingCost =
        chargingStops.reduce(
          (sum, stop) =>
            sum +
            Number(
              stop.estimatedCost || 0
            ),
          0
        );

      const totalEnergyRequired =
        chargingStops.reduce(
          (sum, stop) =>
            sum +
            (
              (
                stop.chargeTo -
                stop.arrivalBattery
              ) / 100
            ) *
            capacity,
          0
        );

      const totalChargingTimeMinutes =
        chargingStops.reduce(
          (sum, stop) =>
            sum +
            Number(
              stop.chargingTimeMinutes || 0
            ),
          0
        );


      /* -----------------------------------------------------
         RESPONSE
         ----------------------------------------------------- */

      res.json({
        success: true,

        route: {
          distanceKm:
            Number(
              routeDistanceKm.toFixed(2)
            ),

          durationMinutes:
            Number(
              routeDurationMinutes.toFixed(1)
            ),

          geometry:
            route.geometry,
        },

        safety: {
          initialBattery:
            currentBattery,

          initialRangeKm:
            Number(
              initialRange.toFixed(2)
            ),

          safetyReserveKm:
            Number(
              safetyReserve.toFixed(2)
            ),

          usableRangeKm:
            Number(
              usableRange.toFixed(2)
            ),
        },

        chargingStops,

        stationCount:
          routeStations.length,

        summary: {
          numberOfStops:
            chargingStops.length,

          totalChargingCost:
            Number(
              totalChargingCost.toFixed(2)
            ),

          totalEnergyRequired:
            Number(
              totalEnergyRequired.toFixed(2)
            ),

          totalChargingTimeMinutes:
            Number(
              totalChargingTimeMinutes.toFixed(1)
            ),

          estimatedArrivalBattery:
            Number(
              finalBattery.toFixed(1)
            ),

          routeComplete,

          message:
            routeComplete
              ? "A safe charging plan was generated for your journey."
              : "The available station dataset does not contain enough compatible charging stations to safely complete this route.",
        },
      });

    } catch (error) {
      console.error(
        "Trip planning error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to generate trip plan.",
      });
    }
  }
);


/* =========================================================
   FAVORITES
   ========================================================= */


/* ---------------------------------------------------------
   GET FAVORITES
   --------------------------------------------------------- */

app.get(
  "/api/favorites",
  authenticateToken,
  (req, res) => {
    try {
      console.log(
        "========================================"
      );

      console.log(
        "GET /api/favorites"
      );

      console.log(
        "Authenticated user:",
        req.user
      );


      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        console.error(
          "Favorites error: user ID missing."
        );

        return;
      }


      console.log(
        "Loading favorites for user ID:",
        userId
      );


      const savedFavorites =
        listFavorites(
          userId
        );


      console.log(
        "Saved favorite records:",
        savedFavorites
      );


      const stations =
        loadStations();


      console.log(
        "Total stations:",
        stations.length
      );


      const favorites =
        savedFavorites
          .map(
            (favorite) => {
              const station =
                stations.find(
                  (item) =>
                    String(
                      item.id
                    ) ===
                    String(
                      favorite.stationId
                    )
                );

              if (!station) {
                console.warn(
                  "Favorite station not found in stations.json:",
                  favorite.stationId
                );

                return null;
              }

              return {
                ...station,

                favoriteId:
                  favorite.id,

                stationId:
                  favorite.stationId,

                favoritedAt:
                  favorite.createdAt,
              };
            }
          )
          .filter(Boolean);


      console.log(
        "Final favorites:",
        favorites
      );

      console.log(
        "========================================"
      );


      res.json({
        success: true,
        favorites,
      });

    } catch (error) {

      console.error(
        "========================================"
      );

      console.error(
        "LIST FAVORITES ERROR"
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Stack:",
        error.stack
      );

      console.error(
        "User:",
        req.user
      );

      console.error(
        "========================================"
      );


      res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load favorites.",

        error:
          error.message,
      });
    }
  }
);


/* ---------------------------------------------------------
   ADD FAVORITE
   --------------------------------------------------------- */

app.post(
  "/api/favorites",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const {
        stationId,
      } = req.body || {};

      if (
        stationId ===
          undefined ||
        stationId ===
          null ||
        String(
          stationId
        ).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Station ID is required.",
        });
      }

      const cleanStationId =
        String(
          stationId
        ).trim();


      /* Verify station exists */

      const station =
        loadStations().find(
          (item) =>
            String(
              item.id
            ) ===
            cleanStationId
        );


      if (!station) {
        return res.status(404).json({
          success: false,
          message:
            "Charging station not found.",
        });
      }


      const favorite =
        addFavorite(
          userId,
          cleanStationId
        );


      res.status(201).json({
        success: true,

        message:
          "Station added to favorites.",

        favorite: {
          ...station,

          favoriteId:
            favorite?.id,

          stationId:
            cleanStationId,

          favoritedAt:
            favorite?.createdAt,
        },
      });

    } catch (error) {

      console.error(
        "Add favorite error:",
        error
      );

      res.status(400).json({
        success: false,

        message:
          error.message ||
          "Unable to save favorite.",
      });
    }
  }
);


/* ---------------------------------------------------------
   REMOVE ONE FAVORITE
   --------------------------------------------------------- */

app.delete(
  "/api/favorites/:stationId",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const stationId =
        String(
          req.params.stationId
        ).trim();


      if (!stationId) {
        return res.status(400).json({
          success: false,
          message:
            "Station ID is required.",
        });
      }


      const deleted =
        removeFavorite(
          userId,
          stationId
        );


      if (!deleted) {
        return res.status(404).json({
          success: false,
          message:
            "Favorite station not found.",
        });
      }


      res.json({
        success: true,
        message:
          "Favorite removed.",
      });

    } catch (error) {

      console.error(
        "Remove favorite error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to remove favorite.",
      });
    }
  }
);


/* ---------------------------------------------------------
   CLEAR ALL FAVORITES
   --------------------------------------------------------- */

app.delete(
  "/api/favorites",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      clearFavorites(
        userId
      );

      res.json({
        success: true,
        message:
          "Favorites cleared.",
      });

    } catch (error) {

      console.error(
        "Clear favorites error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to clear favorites.",
      });
    }
  }
);


/* =========================================================
   REVIEWS
   ========================================================= */

app.get(
  "/api/reviews/:stationId",
  (req, res) => {
    try {
      const stationId =
        String(
          req.params.stationId
        );

      const reviews =
        listReviews(
          stationId
        );

      const total =
        reviews.length;

      const average =
        total
          ? reviews.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.rating || 0
                ),
              0
            ) / total
          : 0;

      const distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      reviews.forEach(
        (review) => {
          const rating =
            Number(
              review.rating
            );

          if (
            distribution[
              rating
            ] !== undefined
          ) {
            distribution[
              rating
            ] += 1;
          }
        }
      );

      res.json({
        success: true,

        stationId,

        averageRating:
          Number(
            average.toFixed(1)
          ),

        totalReviews:
          total,

        distribution,

        reviews,
      });

    } catch (error) {

      console.error(
        "List reviews error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load reviews.",
      });
    }
  }
);


/* =========================================================
   ADD REVIEW
   ========================================================= */

app.post(
  "/api/reviews",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const {
        stationId,
        rating,
        comment,
      } = req.body || {};

      if (
        stationId ===
          undefined ||
        stationId ===
          null ||
        String(
          stationId
        ).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Station ID is required.",
        });
      }

      const numericRating =
        Number(rating);

      const cleanComment =
        typeof comment ===
        "string"
          ? comment.trim()
          : "";

      if (
        !Number.isInteger(
          numericRating
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be an integer from 1 to 5.",
        });
      }

      if (
        !cleanComment ||
        cleanComment.length < 3
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a review comment.",
        });
      }

      const review =
        addReview({
          userId,

          stationId:
            String(
              stationId
            ).trim(),

          rating:
            numericRating,

          comment:
            cleanComment,

          userName:
            req.user.name ||
            req.user.email ||
            "EV Driver",
        });

      res.status(201).json({
        success: true,

        message:
          "Review submitted successfully.",

        review,
      });

    } catch (error) {

      console.error(
        "Add review error:",
        error
      );

      res.status(400).json({
        success: false,

        message:
          error.message ||
          "Unable to submit review.",
      });
    }
  }
);


/* =========================================================
   DELETE REVIEW
   ========================================================= */

app.delete(
  "/api/reviews/:reviewId",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const deleted =
        removeReview(
          String(
            req.params.reviewId
          ),
          userId
        );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found or not owned by you.",
        });
      }

      res.json({
        success: true,
        message:
          "Review deleted.",
      });

    } catch (error) {

      console.error(
        "Delete review error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete review.",
      });
    }
  }
);


/* =========================================================
   TRIP HISTORY
   ========================================================= */

app.get(
  "/api/trip-history",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const trips =
        listTripHistory(
          userId
        );

      res.json({
        success: true,
        trips,
      });

    } catch (error) {

      console.error(
        "List trip history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load trip history.",
      });
    }
  }
);


/* =========================================================
   SAVE TRIP HISTORY
   ========================================================= */

app.post(
  "/api/trip-history",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const body =
        req.body || {};

      const trip =
        addTripHistory(
          userId,
          {
            source:
              body.source ||
              body.start,

            destination:
              body.destination,

            distanceKm:
              body.distanceKm ??
              body.distance,

            durationMinutes:
              body.durationMinutes ??
              body.drivingTimeMinutes,

            vehicleId:
              body.vehicleId ??
              body.vehicle,

            batteryStart:
              body.batteryStart ??
              body.battery,

            arrivalBattery:
              body.arrivalBattery,

            numberOfStops:
              body.numberOfStops ??
              body.chargingStops,

            totalCost:
              body.totalCost ??
              body.chargingCost,

            totalEnergy:
              body.totalEnergy,

            totalChargingTime:
              body.totalChargingTime ??
              body.chargingTimeMinutes,

            routeComplete:
              body.routeComplete,

            tripData:
              body,
          }
        );

      res.status(201).json({
        success: true,

        message:
          "Trip saved to history.",

        trip,
      });

    } catch (error) {

      console.error(
        "Save trip history error:",
        error
      );

      res.status(400).json({
        success: false,

        message:
          error.message ||
          "Unable to save trip history.",
      });
    }
  }
);


/* =========================================================
   DELETE ONE TRIP
   ========================================================= */

app.delete(
  "/api/trip-history/:tripId",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      const deleted =
        removeTripHistory(
          String(
            req.params.tripId
          ),
          userId
        );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message:
            "Trip history record not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Trip removed from history.",
      });

    } catch (error) {

      console.error(
        "Delete trip history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete trip history.",
      });
    }
  }
);


/* =========================================================
   CLEAR TRIP HISTORY
   ========================================================= */

app.delete(
  "/api/trip-history",
  authenticateToken,
  (req, res) => {
    try {
      const userId =
        requireUserId(
          req,
          res
        );

      if (!userId) {
        return;
      }

      clearTripHistory(
        userId
      );

      res.json({
        success: true,
        message:
          "Trip history cleared.",
      });

    } catch (error) {

      console.error(
        "Clear trip history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to clear trip history.",
      });
    }
  }
);


/* =========================================================
   404 HANDLER
   ========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      error:
        "API endpoint not found.",

      path:
        req.originalUrl,
    });
  }
);


/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    res.status(500).json({
      success: false,

      error:
        "Internal server error.",
    });
  }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      "========================================"
    );

    console.log(
      `EV SmartCharge API running on port ${PORT}`
    );

    console.log(
      `http://localhost:${PORT}`
    );

    console.log(
      "========================================"
    );
  }
);