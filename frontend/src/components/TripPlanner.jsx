import React, { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import {
  geocodeLocation,
  planTrip,
} from "../services/api";

import "leaflet/dist/leaflet.css";

/* =========================================================
   MARKER ICONS
   ========================================================= */

const createIcon = (background, symbol) =>
  L.divIcon({
    className: "trip-custom-marker",

    html: `
      <div
        style="
          width:36px;
          height:36px;
          border-radius:50%;
          background:${background};
          border:4px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.25);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:15px;
          font-weight:800;
        "
      >
        ${symbol}
      </div>
    `,

    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

const startIcon = createIcon(
  "#1769aa",
  "A"
);

const destinationIcon = createIcon(
  "#b13b57",
  "B"
);

const chargingIcon = createIcon(
  "#16845f",
  "⚡"
);

/* =========================================================
   MAP AUTO FIT
   ========================================================= */

function TripMapBounds({
  routeCoordinates,
  start,
  destination,
  chargingStops,
}) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (start) {
      points.push([
        Number(start.latitude),
        Number(start.longitude),
      ]);
    }

    if (destination) {
      points.push([
        Number(destination.latitude),
        Number(destination.longitude),
      ]);
    }

    chargingStops.forEach((stop) => {
      if (
        stop.latitude !== undefined &&
        stop.longitude !== undefined
      ) {
        points.push([
          Number(stop.latitude),
          Number(stop.longitude),
        ]);
      }
    });

    routeCoordinates.forEach((point) => {
      points.push([
        Number(point[1]),
        Number(point[0]),
      ]);
    });

    if (points.length > 1) {
      const bounds =
        L.latLngBounds(points);

      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 11,
      });
    }
  }, [
    map,
    routeCoordinates,
    start,
    destination,
    chargingStops,
  ]);

  return null;
}

/* =========================================================
   LOCATION SEARCH BOX
   ========================================================= */

function LocationSearchBox({
  label,
  value,
  setValue,
  selectedLocation,
  setSelectedLocation,
}) {
  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSearch = async () => {
    if (!value.trim()) {
      setError(
        "Please enter a location."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const data =
        await geocodeLocation(value);

      if (
        !data.results ||
        data.results.length === 0
      ) {
        setError(
          "Location not found."
        );
        return;
      }

      setResults(data.results);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
          "Unable to search location."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (
    result
  ) => {
    setSelectedLocation({
      latitude:
        Number(result.latitude),

      longitude:
        Number(result.longitude),

      name:
        result.name ||
        result.displayName,
    });

    setValue(
      result.displayName
    );

    setResults([]);
    setError("");
  };

  return (
    <div className="trip-location-field">

      <label>
        {label}
      </label>

      <div className="trip-location-input">

        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(
              event.target.value
            );

            setSelectedLocation(null);
            setResults([]);
            setError("");
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter"
            ) {
              handleSearch();
            }
          }}
          placeholder={
            label === "Start Location"
              ? "e.g. Hyderabad"
              : "e.g. Bengaluru"
          }
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading
            ? "..."
            : "Search"}
        </button>

      </div>

      {results.length > 0 && (
        <div className="trip-location-results">

          {results.map(
            (result, index) => (
              <button
                type="button"
                key={`${result.latitude}-${result.longitude}-${index}`}
                onClick={() =>
                  selectLocation(
                    result
                  )
                }
              >
                <span>
                  📍
                </span>

                <div>
                  <strong>
                    {result.name}
                  </strong>

                  <small>
                    {
                      result.displayName
                    }
                  </small>
                </div>
              </button>
            )
          )}

        </div>
      )}

      {selectedLocation && (
        <div className="trip-selected-location">
          ✓ {selectedLocation.name}
        </div>
      )}

      {error && (
        <div className="trip-field-error">
          {error}
        </div>
      )}

    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

function TripPlanner({
  vehicles = [],
  battery = 72,
}) {
  const [selectedVehicle, setSelectedVehicle] =
    useState(
      vehicles.length > 0
        ? vehicles[0]
        : null
    );

  const [startText, setStartText] =
    useState("");

  const [destinationText, setDestinationText] =
    useState("");

  const [startLocation, setStartLocation] =
    useState(null);

  const [
    destinationLocation,
    setDestinationLocation,
  ] = useState(null);

  const [tripPlan, setTripPlan] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* -------------------------------------------------------
     KEEP VEHICLE IN SYNC
     ------------------------------------------------------- */

  useEffect(() => {
    if (
      vehicles.length > 0 &&
      !selectedVehicle
    ) {
      setSelectedVehicle(
        vehicles[0]
      );
    }
  }, [
    vehicles,
    selectedVehicle,
  ]);

  /* -------------------------------------------------------
     PLAN TRIP
     ------------------------------------------------------- */

  const handlePlanTrip = async () => {
    setError("");
    setTripPlan(null);

    if (!selectedVehicle) {
      setError(
        "Please select a vehicle."
      );
      return;
    }

    if (!startLocation) {
      setError(
        "Please select a valid start location."
      );
      return;
    }

    if (!destinationLocation) {
      setError(
        "Please select a valid destination."
      );
      return;
    }

    if (
      startLocation.latitude ===
        destinationLocation.latitude &&
      startLocation.longitude ===
        destinationLocation.longitude
    ) {
      setError(
        "Start and destination cannot be the same."
      );
      return;
    }

    setLoading(true);

    try {
      const data =
        await planTrip({
          startLat:
            startLocation.latitude,

          startLon:
            startLocation.longitude,

          endLat:
            destinationLocation.latitude,

          endLon:
            destinationLocation.longitude,

          battery,

          maxRange:
            selectedVehicle.maxRange,

          connector:
            selectedVehicle.connectorType,

          batteryCapacity:
            selectedVehicle.batteryCapacity,

          maxChargingSpeed:
            selectedVehicle.maxChargingSpeed,
        });

      setTripPlan(data);
    } catch (err) {
      console.error(
        "Trip planning error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to generate trip plan."
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     ROUTE COORDINATES
     ------------------------------------------------------- */

  const routeCoordinates =
    useMemo(() => {
      return (
        tripPlan?.route?.geometry
          ?.coordinates || []
      );
    }, [tripPlan]);

  const chargingStops =
    tripPlan?.chargingStops || [];

  /* -------------------------------------------------------
     FORMAT TIME
     ------------------------------------------------------- */

  const formatDuration = (
    minutes
  ) => {
    if (!minutes) {
      return "0 min";
    }

    const hours =
      Math.floor(minutes / 60);

    const remaining =
      Math.round(minutes % 60);

    if (hours === 0) {
      return `${remaining} min`;
    }

    return `${hours}h ${remaining}m`;
  };

  return (
    <section className="trip-planner-section">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="section-heading">

        <p>
          LONG DISTANCE TRAVEL
        </p>

        <h2>
          Smart Trip Planner
        </h2>

        <span>
          Plan your EV journey with
          intelligent charging stops,
          battery safety and estimated
          charging costs.
        </span>

      </div>

      {/* ===================================================
          PLANNER CARD
          =================================================== */}

      <div className="trip-planner-card">

        <div className="trip-planner-header">

          <div>
            <span className="trip-planner-icon">
              🧭
            </span>

            <div>
              <h3>
                Plan Your Journey
              </h3>

              <p>
                We'll calculate the route
                and recommend charging
                stops along the way.
              </p>
            </div>
          </div>

          <span className="trip-status-badge">
            SMART ROUTING
          </span>

        </div>

        <div className="trip-planner-body">

          {/* VEHICLE */}

          <div className="trip-field">

            <label>
              Electric Vehicle
            </label>

            <select
              value={
                selectedVehicle?.id ||
                ""
              }
              onChange={(event) => {
                const vehicle =
                  vehicles.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      event.target.value
                  );

                setSelectedVehicle(
                  vehicle || null
                );
              }}
            >
              {vehicles.map(
                (vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.brand}{" "}
                    {vehicle.model}
                  </option>
                )
              )}
            </select>

          </div>

          {/* LOCATIONS */}

          <div className="trip-location-grid">

            <LocationSearchBox
              label="Start Location"
              value={startText}
              setValue={setStartText}
              selectedLocation={
                startLocation
              }
              setSelectedLocation={
                setStartLocation
              }
            />

            <LocationSearchBox
              label="Destination"
              value={
                destinationText
              }
              setValue={
                setDestinationText
              }
              selectedLocation={
                destinationLocation
              }
              setSelectedLocation={
                setDestinationLocation
              }
            />

          </div>

          {/* CURRENT BATTERY */}

          <div className="trip-battery-row">

            <div>
              <span>
                Current Battery
              </span>

              <strong>
                {battery}%
              </strong>
            </div>

            <div className="trip-battery-bar">

              <div
                style={{
                  width: `${battery}%`,
                }}
              />

            </div>

            <span>
              {selectedVehicle
                ? `${Math.round(
                    (battery / 100) *
                      selectedVehicle.maxRange
                  )} km estimated range`
                : "--"}
            </span>

          </div>

          {/* PLAN BUTTON */}

          <button
            type="button"
            className="trip-plan-button"
            onClick={
              handlePlanTrip
            }
            disabled={loading}
          >
            {loading
              ? "Calculating Smart Route..."
              : "Plan My EV Journey →"}
          </button>

          {error && (
            <div className="trip-planner-error">
              ⚠️ {error}
            </div>
          )}

        </div>
      </div>

      {/* ===================================================
          RESULTS
          =================================================== */}

      {tripPlan && (
        <div className="trip-results">

          {/* ROUTE STATUS */}

          <div
            className={`trip-result-banner ${
              tripPlan.summary
                ?.routeComplete
                ? "success"
                : "warning"
            }`}
          >
            <div>

              <strong>
                {tripPlan.summary
                  ?.routeComplete
                  ? "✓ Safe trip plan generated"
                  : "⚠ More charging coverage required"}
              </strong>

              <span>
                {tripPlan.summary
                  ?.message ||
                  "Trip analysis completed."}
              </span>

            </div>

            <span>
              {
                tripPlan.summary
                  ?.numberOfStops
              }{" "}
              charging stop
              {tripPlan.summary
                ?.numberOfStops === 1
                ? ""
                : "s"}
            </span>

          </div>

          {/* ROUTE KPIs */}

          <div className="trip-kpi-grid">

            <div className="trip-kpi-card">

              <span>
                ROUTE DISTANCE
              </span>

              <strong>
                {
                  tripPlan.route
                    ?.distanceKm
                }{" "}
                <small>km</small>
              </strong>

            </div>

            <div className="trip-kpi-card">

              <span>
                DRIVE TIME
              </span>

              <strong>
                {formatDuration(
                  tripPlan.route
                    ?.durationMinutes
                )}
              </strong>

            </div>

            <div className="trip-kpi-card">

              <span>
                CHARGING TIME
              </span>

              <strong>
                {formatDuration(
                  tripPlan.summary
                    ?.totalChargingTimeMinutes
                )}
              </strong>

            </div>

            <div className="trip-kpi-card">

              <span>
                ESTIMATED COST
              </span>

              <strong>
                ₹
                {
                  tripPlan.summary
                    ?.totalChargingCost
                }
              </strong>

            </div>

          </div>

          {/* =================================================
              ROUTE MAP
              ================================================= */}

          <div className="trip-map-card">

            <div className="trip-map-header">

              <div>
                <span>
                  JOURNEY MAP
                </span>

                <h3>
                  Route & Charging Stops
                </h3>
              </div>

              <div className="trip-map-legend">

                <span>
                  <i className="trip-dot start" />
                  Start
                </span>

                <span>
                  <i className="trip-dot charge" />
                  Charging
                </span>

                <span>
                  <i className="trip-dot destination" />
                  Destination
                </span>

              </div>

            </div>

            <div className="trip-map">

              {startLocation &&
                destinationLocation && (
                  <MapContainer
                    center={[
                      Number(
                        startLocation.latitude
                      ),
                      Number(
                        startLocation.longitude
                      ),
                    ]}
                    zoom={8}
                    scrollWheelZoom={true}
                    style={{
                      width: "100%",
                      height: "520px",
                    }}
                  >

                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <TripMapBounds
                      routeCoordinates={
                        routeCoordinates
                      }
                      start={
                        startLocation
                      }
                      destination={
                        destinationLocation
                      }
                      chargingStops={
                        chargingStops
                      }
                    />

                    {/* ROUTE LINE */}

                    {routeCoordinates.length >
                      1 && (
                      <Polyline
                        positions={routeCoordinates.map(
                          (point) => [
                            Number(
                              point[1]
                            ),
                            Number(
                              point[0]
                            ),
                          ]
                        )}
                        pathOptions={{
                          color:
                            "#16845f",
                          weight: 5,
                          opacity: 0.85,
                        }}
                      />
                    )}

                    {/* START */}

                    <Marker
                      position={[
                        Number(
                          startLocation.latitude
                        ),
                        Number(
                          startLocation.longitude
                        ),
                      ]}
                      icon={startIcon}
                    >
                      <Popup>
                        <strong>
                          🅰 Start
                        </strong>
                        <br />
                        {
                          startLocation.name
                        }
                      </Popup>
                    </Marker>

                    {/* DESTINATION */}

                    <Marker
                      position={[
                        Number(
                          destinationLocation.latitude
                        ),
                        Number(
                          destinationLocation.longitude
                        ),
                      ]}
                      icon={
                        destinationIcon
                      }
                    >
                      <Popup>
                        <strong>
                          🅱 Destination
                        </strong>
                        <br />
                        {
                          destinationLocation.name
                        }
                      </Popup>
                    </Marker>

                    {/* CHARGING STOPS */}

                    {chargingStops.map(
                      (stop) => (
                        <Marker
                          key={`${stop.stationId}-${stop.sequence}`}
                          position={[
                            Number(
                              stop.latitude
                            ),
                            Number(
                              stop.longitude
                            ),
                          ]}
                          icon={
                            chargingIcon
                          }
                        >
                          <Popup>

                            <div className="trip-stop-popup">

                              <h3>
                                ⚡{" "}
                                {
                                  stop.stationName
                                }
                              </h3>

                              <p>
                                {
                                  stop.location
                                }
                              </p>

                              <hr />

                              <div>
                                <span>
                                  Arrival Battery
                                </span>

                                <strong>
                                  {
                                    stop.arrivalBattery
                                  }%
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Charge To
                                </span>

                                <strong>
                                  {
                                    stop.chargeTo
                                  }%
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Charging Time
                                </span>

                                <strong>
                                  {formatDuration(
                                    stop.chargingTimeMinutes
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Estimated Cost
                                </span>

                                <strong>
                                  ₹
                                  {
                                    stop.estimatedCost
                                  }
                                </strong>
                              </div>

                            </div>

                          </Popup>
                        </Marker>
                      )
                    )}

                  </MapContainer>
                )}

            </div>

          </div>

          {/* =================================================
              SAFETY CARD
              ================================================= */}

          <div className="trip-safety-card">

            <div className="trip-safety-icon">
              🛡️
            </div>

            <div>

              <span>
                BATTERY SAFETY
              </span>

              <h3>
                Journey Safety Analysis
              </h3>

              <p>
                The planner keeps a recommended
                15% battery reserve when evaluating
                whether each section of the journey
                is reachable.
              </p>

            </div>

            <div className="trip-safety-values">

              <div>
                <small>
                  INITIAL RANGE
                </small>

                <strong>
                  {
                    tripPlan.safety
                      ?.initialRangeKm
                  }{" "}
                  km
                </strong>
              </div>

              <div>
                <small>
                  SAFETY RESERVE
                </small>

                <strong>
                  {
                    tripPlan.safety
                      ?.safetyReserveKm
                  }{" "}
                  km
                </strong>
              </div>

              <div>
                <small>
                  USABLE RANGE
                </small>

                <strong>
                  {
                    tripPlan.safety
                      ?.usableRangeKm
                  }{" "}
                  km
                </strong>
              </div>

              <div>
                <small>
                  ARRIVAL BATTERY
                </small>

                <strong>
                  {
                    tripPlan.summary
                      ?.estimatedArrivalBattery
                  }%
                </strong>
              </div>

            </div>

          </div>

          {/* =================================================
              CHARGING STOPS
              ================================================= */}

          <div className="trip-stops-section">

            <div className="trip-stops-heading">

              <div>
                <span>
                  RECOMMENDED STOPS
                </span>

                <h3>
                  Charging Plan
                </h3>
              </div>

              <strong>
                {
                  chargingStops.length
                }{" "}
                Stops
              </strong>

            </div>

            {chargingStops.length ===
            0 ? (
              <div className="trip-no-stops">
                <span>
                  ✓
                </span>

                <div>
                  <strong>
                    No charging stop required
                  </strong>

                  <p>
                    Your current battery
                    is sufficient for this
                    journey.
                  </p>
                </div>
              </div>
            ) : (
              <div className="trip-stop-list">

                {chargingStops.map(
                  (stop) => (
                    <div
                      className="trip-stop-card"
                      key={`${stop.stationId}-${stop.sequence}`}
                    >

                      <div className="trip-stop-number">
                        {
                          stop.sequence
                        }
                      </div>

                      <div className="trip-stop-main">

                        <div className="trip-stop-title">

                          <div>
                            <h4>
                              ⚡{" "}
                              {
                                stop.stationName
                              }
                            </h4>

                            <p>
                              📍{" "}
                              {
                                stop.location
                              }
                            </p>
                          </div>

                          <span>
                            ⭐{" "}
                            {
                              stop.rating
                            }
                          </span>

                        </div>

                        <div className="trip-stop-metrics">

                          <div>
                            <small>
                              ARRIVAL
                            </small>

                            <strong>
                              {
                                stop.arrivalBattery
                              }%
                            </strong>
                          </div>

                          <div>
                            <small>
                              CHARGE TO
                            </small>

                            <strong>
                              {
                                stop.chargeTo
                              }%
                            </strong>
                          </div>

                          <div>
                            <small>
                              SPEED
                            </small>

                            <strong>
                              {
                                stop.chargingSpeed
                              }{" "}
                              kW
                            </strong>
                          </div>

                          <div>
                            <small>
                              TIME
                            </small>

                            <strong>
                              {formatDuration(
                                stop.chargingTimeMinutes
                              )}
                            </strong>
                          </div>

                          <div>
                            <small>
                              COST
                            </small>

                            <strong>
                              ₹
                              {
                                stop.estimatedCost
                              }
                            </strong>
                          </div>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          {/* TOTALS */}

          <div className="trip-total-card">

            <div>
              <span>
                TOTAL ENERGY
              </span>

              <strong>
                {
                  tripPlan.summary
                    ?.totalEnergyRequired
                }{" "}
                kWh
              </strong>
            </div>

            <div>
              <span>
                TOTAL CHARGING TIME
              </span>

              <strong>
                {formatDuration(
                  tripPlan.summary
                    ?.totalChargingTimeMinutes
                )}
              </strong>
            </div>

            <div>
              <span>
                TOTAL CHARGING COST
              </span>

              <strong>
                ₹
                {
                  tripPlan.summary
                    ?.totalChargingCost
                }
              </strong>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default TripPlanner;