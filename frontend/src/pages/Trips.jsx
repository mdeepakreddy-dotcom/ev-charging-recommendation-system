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

import Navbar from "../components/Navbar";
import "./Trips.css";

import "leaflet/dist/leaflet.css";

const API_URL = "http://localhost:3000/api";
const TOKEN_KEY = "evSmartChargeToken";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


function MapFitter({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route || route.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(route);

    map.fitBounds(bounds, {
      padding: [35, 35],
    });
  }, [route, map]);

  return null;
}


function Trips() {
  const [vehicles, setVehicles] = useState([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState(null);

  const [battery, setBattery] = useState(72);

  const [startText, setStartText] =
    useState("Hyderabad");

  const [destinationText, setDestinationText] =
    useState("Bengaluru");

  const [startLocation, setStartLocation] =
    useState({
      latitude: 17.385,
      longitude: 78.4867,
      name: "Hyderabad",
    });

  const [destinationLocation, setDestinationLocation] =
    useState({
      latitude: 12.9716,
      longitude: 77.5946,
      name: "Bengaluru",
    });

  const [targetCharge, setTargetCharge] =
    useState(75);

  const [startSuggestions, setStartSuggestions] =
    useState([]);

  const [destinationSuggestions, setDestinationSuggestions] =
    useState([]);

  const [searchingStart, setSearchingStart] =
    useState(false);

  const [searchingDestination, setSearchingDestination] =
    useState(false);

  const [planning, setPlanning] =
    useState(false);

  const [plan, setPlan] =
    useState(null);

  const [error, setError] =
    useState("");

  const [locationMessage, setLocationMessage] =
    useState("Use my location");

  const [saveMessage, setSaveMessage] =
    useState("");


  useEffect(() => {
    loadVehicles();
  }, []);


  async function loadVehicles() {
    try {
      const response = await fetch(
        `${API_URL}/vehicles`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load vehicles."
        );
      }

      const data = await response.json();

      const list =
        Array.isArray(data)
          ? data
          : data?.vehicles || [];

      setVehicles(list);

      if (list.length > 0) {
        setSelectedVehicle(list[0]);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load vehicle information."
      );
    }
  }


  async function searchLocation(
    value,
    type
  ) {
    if (!value.trim()) {
      return;
    }

    if (type === "start") {
      setSearchingStart(true);
    } else {
      setSearchingDestination(true);
    }

    try {
      const response = await fetch(
        `${API_URL}/geocode?query=${encodeURIComponent(
          value
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Location search failed."
        );
      }

      const data = await response.json();

      const results =
        data?.results || [];

      if (type === "start") {
        setStartSuggestions(results);
      } else {
        setDestinationSuggestions(
          results
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to search this location."
      );
    } finally {
      if (type === "start") {
        setSearchingStart(false);
      } else {
        setSearchingDestination(false);
      }
    }
  }


  function selectLocation(
    locationData,
    type
  ) {
    const selected = {
      latitude:
        Number(locationData.latitude),

      longitude:
        Number(locationData.longitude),

      name:
        locationData.name ||
        locationData.displayName ||
        "Selected location",
    };

    if (type === "start") {
      setStartLocation(selected);

      setStartText(
        selected.name
      );

      setStartSuggestions([]);
    } else {
      setDestinationLocation(
        selected
      );

      setDestinationText(
        selected.name
      );

      setDestinationSuggestions(
        []
      );
    }
  }


  function detectCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Location unavailable"
      );

      return;
    }

    setLocationMessage(
      "Detecting..."
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        try {
          const response =
            await fetch(
              `${API_URL}/geocode?query=${latitude},${longitude}`
            );

          const data =
            await response.json();

          const first =
            data?.results?.[0];

          const locationData = {
            latitude,
            longitude,
            name:
              first?.name ||
              "Current location",
          };

          setStartLocation(
            locationData
          );

          setStartText(
            locationData.name
          );

          setLocationMessage(
            "Current location"
          );
        } catch {
          setStartLocation({
            latitude,
            longitude,
            name: "Current location",
          });

          setStartText(
            "Current location"
          );

          setLocationMessage(
            "Current location"
          );
        }
      },
      () => {
        setLocationMessage(
          "Location permission denied"
        );
      }
    );
  }


  function buildTripUrl() {
    if (!selectedVehicle) {
      return null;
    }

    const params =
      new URLSearchParams({
        startLat:
          String(
            startLocation.latitude
          ),

        startLon:
          String(
            startLocation.longitude
          ),

        endLat:
          String(
            destinationLocation.latitude
          ),

        endLon:
          String(
            destinationLocation.longitude
          ),

        battery:
          String(battery),

        maxRange:
          String(
            selectedVehicle.maxRange ||
              selectedVehicle.range ||
              0
          ),

        connector:
          selectedVehicle.connectorType ||
          selectedVehicle.connector ||
          "CCS2",

        batteryCapacity:
          String(
            selectedVehicle.batteryCapacity ||
              selectedVehicle.capacity ||
              0
          ),

        maxChargingSpeed:
          String(
            selectedVehicle.maxChargingSpeed ||
              selectedVehicle.maxChargingPower ||
              50
          ),
      });

    return `${API_URL}/trip-plan?${params.toString()}`;
  }


  /*
   * SAVE GENERATED TRIP
   *
   * Sends the completed trip plan to the
   * authenticated user's Trip History.
   */

  async function saveTripToHistory(
    tripPlan
  ) {
    const token =
      localStorage.getItem(
        TOKEN_KEY
      );

    if (!token) {
      setSaveMessage(
        "Trip generated, but login is required to save it."
      );

      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/trip-history`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              start:
                startText,

              destination:
                destinationText,

              distance:
                Number(
                  tripPlan.route
                    ?.distanceKm || 0
                ),

              chargingStops:
                Number(
                  tripPlan.summary
                    ?.numberOfStops || 0
                ),

              chargingCost:
                Number(
                  tripPlan.summary
                    ?.totalChargingCost || 0
                ),

              chargingTimeMinutes:
                Number(
                  tripPlan.summary
                    ?.totalChargingTimeMinutes ||
                    0
                ),

              drivingTimeMinutes:
                Number(
                  tripPlan.route
                    ?.durationMinutes || 0
                ),

              vehicle:
                selectedVehicle?.brand
                  ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                  : selectedVehicle?.model ||
                    "Unknown vehicle",

              battery:
                Number(battery),

              arrivalBattery:
                Number(
                  tripPlan.summary
                    ?.estimatedArrivalBattery ||
                    0
                ),

              targetCharge:
                Number(targetCharge),

              routeComplete:
                Boolean(
                  tripPlan.summary
                    ?.routeComplete
                ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to save trip history."
        );
      }

      setSaveMessage(
        "✓ Trip saved to Trip History."
      );
    } catch (err) {
      console.error(
        "Trip history save error:",
        err
      );

      /*
       * Do not fail the trip planner just because
       * history saving failed.
       */

      setSaveMessage(
        "Trip generated successfully, but it could not be saved to history."
      );
    }
  }


  async function generateTripPlan() {
    setError("");
    setSaveMessage("");
    setPlan(null);

    if (!selectedVehicle) {
      setError(
        "Please select a vehicle."
      );

      return;
    }

    if (
      !startLocation ||
      !destinationLocation
    ) {
      setError(
        "Please select both locations."
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

    setPlanning(true);

    try {
      const url =
        buildTripUrl();

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to generate trip plan."
        );
      }

      setPlan(data);

      /*
       * Save the successfully generated
       * trip to the user's history.
       */

      await saveTripToHistory(data);

    } catch (err) {
      console.error(
        "Trip planning error:",
        err
      );

      setError(
        err.message ||
          "Unable to generate trip plan."
      );
    } finally {
      setPlanning(false);
    }
  }


  function swapLocations() {
    const oldStart =
      startLocation;

    const oldStartText =
      startText;

    setStartLocation(
      destinationLocation
    );

    setStartText(
      destinationText
    );

    setDestinationLocation(
      oldStart
    );

    setDestinationText(
      oldStartText
    );

    setPlan(null);
    setSaveMessage("");
  }


  const routeCoordinates =
    useMemo(() => {
      const geometry =
        plan?.route?.geometry;

      if (
        !geometry ||
        !geometry.coordinates
      ) {
        return [];
      }

      return geometry.coordinates.map(
        (coordinate) => [
          Number(coordinate[1]),
          Number(coordinate[0]),
        ]
      );
    }, [plan]);


  const stopCoordinates =
    useMemo(() => {
      if (
        !plan?.chargingStops
      ) {
        return [];
      }

      return plan.chargingStops
        .filter(
          (stop) =>
            stop.latitude !== undefined &&
            stop.longitude !== undefined
        )
        .map((stop) => ({
          ...stop,

          position: [
            Number(stop.latitude),
            Number(stop.longitude),
          ],
        }));
    }, [plan]);


  const initialMapCenter = [
    Number(
      startLocation.latitude
    ),
    Number(
      startLocation.longitude
    ),
  ];


  function formatDuration(minutes) {
    const total =
      Number(minutes || 0);

    const hours =
      Math.floor(total / 60);

    const mins =
      Math.round(total % 60);

    if (hours === 0) {
      return `${mins} min`;
    }

    return `${hours}h ${mins}m`;
  }


  /* ======================================================
     OPEN GOOGLE MAPS NAVIGATION TO A CHARGING STOP
     ====================================================== */
  function navigateToChargingStop(stop, index) {
    const destinationLatitude = Number(stop?.latitude);
    const destinationLongitude = Number(stop?.longitude);

    if (
      !Number.isFinite(destinationLatitude) ||
      !Number.isFinite(destinationLongitude)
    ) {
      window.alert(
        "Google Maps navigation is unavailable because this station has no valid coordinates."
      );
      return;
    }

    // For stop 1, start from the trip origin. For later stops,
    // navigate from the previous recommended charging stop.
    const previousStop =
      index > 0 ? plan?.chargingStops?.[index - 1] : null;

    const originLatitude = Number(
      previousStop?.latitude ?? startLocation?.latitude
    );
    const originLongitude = Number(
      previousStop?.longitude ?? startLocation?.longitude
    );

    const params = new URLSearchParams({
      api: "1",
      destination: `${destinationLatitude},${destinationLongitude}`,
      travelmode: "driving",
    });

    if (
      Number.isFinite(originLatitude) &&
      Number.isFinite(originLongitude)
    ) {
      params.set(
        "origin",
        `${originLatitude},${originLongitude}`
      );
    }

    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  return (
    <div className="trips-page">

      <Navbar />

      <main className="trips-main">

        {/* HEADER */}

        <section className="trips-header">

          <div>

            <span className="trips-eyebrow">
              SMART JOURNEY PLANNER
            </span>

            <h1>
              Plan Your EV Journey
            </h1>

            <p>
              Build a safe and efficient
              long-distance trip with
              intelligent charging stops.
            </p>

          </div>

          <div className="trip-header-badge">

            <span>
              ⚡
            </span>

            <div>
              <strong>
                EV Smart Planning
              </strong>

              <small>
                Battery-aware routing
              </small>
            </div>

          </div>

        </section>


        {/* MAIN PLANNER */}

        <section className="trip-planner-layout">


          {/* LEFT CONTROL PANEL */}

          <div className="trip-control-panel">

            <div className="trip-panel-title">

              <span>
                01
              </span>

              <div>
                <h2>
                  Journey Details
                </h2>

                <p>
                  Enter your route and vehicle
                  information.
                </p>
              </div>

            </div>


            {/* START */}

            <div className="trip-field">

              <label>
                START LOCATION
              </label>

              <div className="trip-location-input">

                <span className="start-dot"></span>

                <input
                  value={startText}
                  onChange={(event) => {
                    setStartText(
                      event.target.value
                    );

                    setStartSuggestions([]);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      searchLocation(
                        startText,
                        "start"
                      );
                    }
                  }}
                  placeholder="Enter starting location"
                />

                <button
                  type="button"
                  onClick={() =>
                    searchLocation(
                      startText,
                      "start"
                    )
                  }
                >
                  {searchingStart
                    ? "..."
                    : "Search"}
                </button>

              </div>


              {startSuggestions.length >
                0 && (

                <div className="location-suggestions">

                  {startSuggestions.map(
                    (item, index) => (

                      <button
                        key={`${item.latitude}-${item.longitude}-${index}`}
                        type="button"
                        onClick={() =>
                          selectLocation(
                            item,
                            "start"
                          )
                        }
                      >
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {item.displayName}
                        </span>
                      </button>

                    )
                  )}

                </div>

              )}


              <button
                type="button"
                className="current-location-button"
                onClick={
                  detectCurrentLocation
                }
              >
                ◎{" "}
                {locationMessage}
              </button>

            </div>


            {/* SWAP */}

            <div className="trip-swap-row">

              <div></div>

              <button
                type="button"
                onClick={
                  swapLocations
                }
                title="Swap locations"
              >
                ⇅
              </button>

              <div></div>

            </div>


            {/* DESTINATION */}

            <div className="trip-field">

              <label>
                DESTINATION
              </label>

              <div className="trip-location-input">

                <span className="destination-dot"></span>

                <input
                  value={
                    destinationText
                  }
                  onChange={(event) => {
                    setDestinationText(
                      event.target.value
                    );

                    setDestinationSuggestions(
                      []
                    );
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      searchLocation(
                        destinationText,
                        "destination"
                      );
                    }
                  }}
                  placeholder="Enter destination"
                />

                <button
                  type="button"
                  onClick={() =>
                    searchLocation(
                      destinationText,
                      "destination"
                    )
                  }
                >
                  {searchingDestination
                    ? "..."
                    : "Search"}
                </button>

              </div>


              {destinationSuggestions.length >
                0 && (

                <div className="location-suggestions">

                  {destinationSuggestions.map(
                    (item, index) => (

                      <button
                        key={`${item.latitude}-${item.longitude}-${index}`}
                        type="button"
                        onClick={() =>
                          selectLocation(
                            item,
                            "destination"
                          )
                        }
                      >
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          {item.displayName}
                        </span>
                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            {/* VEHICLE */}

            <div className="trip-field">

              <label>
                VEHICLE
              </label>

              <select
                value={
                  selectedVehicle?.id ||
                  selectedVehicle?._id ||
                  ""
                }
                onChange={(event) => {

                  const vehicle =
                    vehicles.find(
                      (item) =>
                        String(
                          item.id ||
                            item._id
                        ) ===
                        event.target.value
                    );

                  setSelectedVehicle(
                    vehicle || null
                  );

                  setPlan(null);
                  setSaveMessage("");
                }}
              >

                {vehicles.length ===
                0 ? (

                  <option>
                    Loading vehicles...
                  </option>

                ) : (

                  vehicles.map(
                    (vehicle, index) => (

                      <option
                        key={
                          vehicle.id ||
                          vehicle._id ||
                          index
                        }
                        value={
                          vehicle.id ||
                          vehicle._id ||
                          ""
                        }
                      >
                        {vehicle.brand
                          ? `${vehicle.brand} ${vehicle.model}`
                          : vehicle.model}
                      </option>

                    )
                  )

                )}

              </select>

            </div>


            {/* BATTERY */}

            <div className="trip-field">

              <div className="field-label-row">

                <label>
                  CURRENT BATTERY
                </label>

                <strong>
                  {battery}%
                </strong>

              </div>

              <input
                className="battery-range"
                type="range"
                min="10"
                max="100"
                value={battery}
                onChange={(event) => {
                  setBattery(
                    Number(
                      event.target.value
                    )
                  );

                  setPlan(null);
                  setSaveMessage("");
                }}
              />

              <div className="range-labels">

                <span>
                  10%
                </span>

                <span>
                  100%
                </span>

              </div>

            </div>


            {/* TARGET */}

            <div className="trip-field">

              <div className="field-label-row">

                <label>
                  TARGET ARRIVAL CHARGE
                </label>

                <strong>
                  {targetCharge}%
                </strong>

              </div>

              <input
                className="battery-range"
                type="range"
                min="30"
                max="100"
                value={targetCharge}
                onChange={(event) =>
                  setTargetCharge(
                    Number(
                      event.target.value
                    )
                  )
                }
              />

              <div className="range-labels">

                <span>
                  30%
                </span>

                <span>
                  100%
                </span>

              </div>

            </div>


            {/* VEHICLE INFO */}

            {selectedVehicle && (

              <div className="vehicle-trip-summary">

                <div className="vehicle-trip-icon">
                  ⚡
                </div>

                <div>

                  <strong>
                    {selectedVehicle.brand
                      ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                      : selectedVehicle.model}
                  </strong>

                  <span>
                    Range{" "}
                    {selectedVehicle.maxRange ||
                      selectedVehicle.range ||
                      "--"}{" "}
                    km
                    {" • "}
                    {selectedVehicle.connectorType ||
                      selectedVehicle.connector ||
                      "CCS2"}
                  </span>

                </div>

              </div>

            )}


            {/* ERROR */}

            {error && (

              <div className="trip-error">

                <strong>
                  ⚠ Trip planning failed
                </strong>

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* SAVE MESSAGE */}

            {saveMessage && (

              <div
                className={
                  saveMessage.startsWith("✓")
                    ? "trip-save-message success"
                    : "trip-save-message warning"
                }
              >
                {saveMessage}
              </div>

            )}


            {/* PLAN BUTTON */}

            <button
              className="generate-trip-button"
              type="button"
              onClick={
                generateTripPlan
              }
              disabled={planning}
            >

              {planning ? (
                <>
                  <span className="button-spinner"></span>
                  Calculating route...
                </>
              ) : (
                <>
                  ⚡ Generate Smart Trip
                </>
              )}

            </button>

          </div>


          {/* RIGHT MAP */}

          <div className="trip-map-panel">

            <div className="trip-map-header">

              <div>

                <span>
                  ROUTE PREVIEW
                </span>

                <h2>
                  Your Journey
                </h2>

              </div>

              {plan && (
                <span className="route-ready">
                  ● ROUTE READY
                </span>
              )}

            </div>


            <div className="trip-map-container">

              <MapContainer
                center={
                  initialMapCenter
                }
                zoom={6}
                scrollWheelZoom={true}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >

                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                {routeCoordinates.length >
                  0 && (

                  <>

                    <MapFitter
                      route={
                        routeCoordinates
                      }
                    />

                    <Polyline
                      positions={
                        routeCoordinates
                      }
                      pathOptions={{
                        color: "#20b878",
                        weight: 5,
                        opacity: 0.85,
                      }}
                    />

                  </>

                )}


                <Marker
                  position={[
                    startLocation.latitude,
                    startLocation.longitude,
                  ]}
                >

                  <Popup>

                    <strong>
                      Start
                    </strong>

                    <br />

                    {startText}

                  </Popup>

                </Marker>


                <Marker
                  position={[
                    destinationLocation.latitude,
                    destinationLocation.longitude,
                  ]}
                >

                  <Popup>

                    <strong>
                      Destination
                    </strong>

                    <br />

                    {destinationText}

                  </Popup>

                </Marker>


                {stopCoordinates.map(
                  (stop, index) => (

                    <Marker
                      key={
                        stop.stationId ||
                        stop.id ||
                        index
                      }
                      position={
                        stop.position
                      }
                    >

                      <Popup>

                        <strong>
                          Charging Stop{" "}
                          {index + 1}
                        </strong>

                        <br />

                        {stop.name ||
                          stop.stationName ||
                          "Charging Station"}

                        <br />

                        {stop.chargingPower ||
                          stop.maxPower ||
                          "--"}{" "}
                        kW

                      </Popup>

                    </Marker>

                  )
                )}

              </MapContainer>


              {!plan && (

                <div className="map-empty-overlay">

                  <div>
                    🗺️
                  </div>

                  <strong>
                    Your route will appear here
                  </strong>

                  <span>
                    Enter your journey details
                    and generate a smart trip.
                  </span>

                </div>

              )}

            </div>

          </div>

        </section>


        {/* RESULTS */}

        {plan && (

          <section className="trip-results">

            {/* RESULT HEADER */}

            <div className="trip-result-header">

              <div>

                <span>
                  SMART TRIP PLAN
                </span>

                <h2>
                  {startText}
                  <span> → </span>
                  {destinationText}
                </h2>

              </div>

              <div
                className={
                  plan.summary?.routeComplete
                    ? "route-complete"
                    : "route-warning"
                }
              >
                {plan.summary
                  ?.routeComplete
                  ? "✓ SAFE ROUTE"
                  : "⚠ REVIEW ROUTE"}
              </div>

            </div>


            {/* METRICS */}

            <div className="trip-result-metrics">

              <div className="trip-result-metric">

                <span>
                  ROUTE DISTANCE
                </span>

                <strong>
                  {plan.route
                    ?.distanceKm ??
                    "--"}{" "}
                  <small>
                    km
                  </small>
                </strong>

              </div>


              <div className="trip-result-metric">

                <span>
                  DRIVING TIME
                </span>

                <strong>
                  {formatDuration(
                    plan.route
                      ?.durationMinutes
                  )}
                </strong>

              </div>


              <div className="trip-result-metric">

                <span>
                  CHARGING STOPS
                </span>

                <strong>
                  {plan.summary
                    ?.numberOfStops ??
                    0}
                </strong>

              </div>


              <div className="trip-result-metric">

                <span>
                  CHARGING COST
                </span>

                <strong>
                  ₹
                  {plan.summary
                    ?.totalChargingCost ??
                    0}
                </strong>

              </div>


              <div className="trip-result-metric">

                <span>
                  CHARGING TIME
                </span>

                <strong>
                  {formatDuration(
                    plan.summary
                      ?.totalChargingTimeMinutes
                  )}
                </strong>

              </div>


              <div className="trip-result-metric">

                <span>
                  ARRIVAL BATTERY
                </span>

                <strong>
                  {plan.summary
                    ?.estimatedArrivalBattery ??
                    "--"}
                  %
                </strong>

              </div>

            </div>


            {/* SAFETY */}

            <div className="trip-safety-card">

              <div className="trip-safety-icon">
                🛡️
              </div>

              <div>

                <span>
                  BATTERY SAFETY
                </span>

                <h3>
                  {plan.summary?.message ||
                    "Safety analysis completed."}
                </h3>

                <p>
                  Starting range:{" "}
                  <strong>
                    {plan.safety
                      ?.initialRangeKm ??
                      "--"}{" "}
                    km
                  </strong>

                  {" • "}

                  Safety reserve:{" "}
                  <strong>
                    {plan.safety
                      ?.safetyReserveKm ??
                      "--"}{" "}
                    km
                  </strong>

                  {" • "}

                  Usable range:{" "}
                  <strong>
                    {plan.safety
                      ?.usableRangeKm ??
                      "--"}{" "}
                    km
                  </strong>
                </p>

              </div>

            </div>


            {/* CHARGING STOPS */}

            <div className="charging-stops-section">

              <div className="result-section-heading">

                <div>

                  <span>
                    CHARGING STRATEGY
                  </span>

                  <h2>
                    Recommended Charging Stops
                  </h2>

                </div>

                <span>
                  {plan.chargingStops
                    ?.length || 0}{" "}
                  stops
                </span>

              </div>


              {plan.chargingStops?.length >
              0 ? (

                <div className="charging-stop-list">

                  {plan.chargingStops.map(
                    (stop, index) => (

                      <article
                        className="charging-stop-card"
                        key={
                          stop.stationId ||
                          stop.id ||
                          index
                        }
                      >

                        <div className="stop-number">
                          {index + 1}
                        </div>


                        <div className="stop-main">

                          <div className="stop-top">

                            <div>

                              <span className="stop-label">
                                CHARGING STOP{" "}
                                {index + 1}
                              </span>

                              <h3>
                                {stop.name ||
                                  stop.stationName ||
                                  "Charging Station"}
                              </h3>

                              <p>
                                {stop.location ||
                                  stop.address ||
                                  "Recommended charging location"}
                              </p>

                            </div>

                            <span className="stop-rating">
                              ⭐{" "}
                              {stop.rating ||
                                "N/A"}
                            </span>

                          </div>


                          <div className="stop-details">

                            <span>
                              ⚡{" "}
                              {stop.chargingPower ||
                                stop.maxPower ||
                                stop.power ||
                                "--"}{" "}
                              kW
                            </span>

                            <span>
                              🔌{" "}
                              {stop.connector ||
                                stop.connectorType ||
                                "CCS2"}
                            </span>

                            <span>
                              ₹
                              {stop.pricePerKwh ||
                                stop.price ||
                                "--"}
                              /kWh
                            </span>

                            <span>
                              ⏱{" "}
                              {formatDuration(
                                stop.chargingTimeMinutes
                              )}
                            </span>

                          </div>

                        </div>


                        <div className="stop-navigation-row">
                          <button
                            type="button"
                            className="stop-navigation-button"
                            onClick={() =>
                              navigateToChargingStop(stop, index)
                            }
                            disabled={
                              !Number.isFinite(Number(stop.latitude)) ||
                              !Number.isFinite(Number(stop.longitude))
                            }
                            title="Open driving directions in Google Maps"
                          >
                            <span aria-hidden="true">↗</span>
                            Navigate with Google Maps
                          </button>
                        </div>


                        <div className="stop-energy">

                          <div>

                            <span>
                              ARRIVAL
                            </span>

                            <strong>
                              {stop.arrivalBattery ??
                                "--"}
                              %
                            </strong>

                          </div>

                          <div>

                            <span>
                              CHARGE TO
                            </span>

                            <strong>
                              {stop.chargeTo ??
                                "--"}
                              %
                            </strong>

                          </div>

                          <div>

                            <span>
                              COST
                            </span>

                            <strong>
                              ₹
                              {stop.estimatedCost ??
                                "--"}
                            </strong>

                          </div>

                        </div>

                      </article>

                    )
                  )}

                </div>

              ) : (

                <div className="no-stops-card">

                  <span>
                    ✓
                  </span>

                  <div>

                    <strong>
                      No charging stops required
                    </strong>

                    <p>
                      Your vehicle has enough
                      usable range for this route.
                    </p>

                  </div>

                </div>

              )}

            </div>


            {/* TRIP SUMMARY */}

            <div className="trip-summary-footer">

              <div>

                <span>
                  TOTAL ENERGY
                </span>

                <strong>
                  {plan.summary
                    ?.totalEnergyRequired ??
                    0}{" "}
                  kWh
                </strong>

              </div>

              <div>

                <span>
                  TARGET ARRIVAL
                </span>

                <strong>
                  {targetCharge}%
                </strong>

              </div>

              <div>

                <span>
                  VEHICLE
                </span>

                <strong>
                  {selectedVehicle?.brand
                    ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                    : selectedVehicle?.model ||
                      "--"}
                </strong>

              </div>

            </div>

          </section>

        )}


        <footer className="trips-footer">

          <strong>
            ⚡ EV SmartCharge
          </strong>

          <span>
            Intelligent EV route planning
            • Battery safety • Smart charging
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Trips;