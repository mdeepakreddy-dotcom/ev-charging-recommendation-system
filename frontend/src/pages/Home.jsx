import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/config";

const API_URL = API_BASE_URL;

function Home() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [battery, setBattery] = useState(72);

  const [loading, setLoading] = useState(true);
  const [stationLoading, setStationLoading] = useState(true);

  const [locationStatus, setLocationStatus] =
    useState("Location not connected");

  const [currentLocation, setCurrentLocation] =
    useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const vehicleResponse = await fetch(
        `${API_URL}/vehicles`
      );

      if (vehicleResponse.ok) {
        const vehicleData =
          await vehicleResponse.json();

        const vehicleList = Array.isArray(vehicleData)
          ? vehicleData
          : vehicleData.vehicles || [];

        setVehicles(vehicleList);

        if (vehicleList.length > 0) {
          setSelectedVehicle(vehicleList[0]);
        }
      }
    } catch (error) {
      console.error(
        "Vehicle loading error:",
        error
      );
    } finally {
      setLoading(false);
    }

    try {
      setStationLoading(true);

      const stationResponse = await fetch(
        `${API_URL}/stations`
      );

      if (stationResponse.ok) {
        const stationData =
          await stationResponse.json();

        const stationList = Array.isArray(stationData)
          ? stationData
          : stationData.stations || [];

        setStations(stationList);
      }
    } catch (error) {
      console.error(
        "Station loading error:",
        error
      );
    } finally {
      setStationLoading(false);
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Geolocation is not supported"
      );
      return;
    }

    setLocationStatus("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setCurrentLocation({
          latitude,
          longitude,
        });

        setLocationStatus(
          "Current location connected"
        );
      },
      () => {
        setLocationStatus(
          "Unable to access location"
        );
      }
    );
  }

  const currentRange = useMemo(() => {
    if (!selectedVehicle) {
      return 0;
    }

    const maxRange = Number(
      selectedVehicle.maxRange || 0
    );

    return Math.round(
      (battery / 100) * maxRange
    );
  }, [battery, selectedVehicle]);

  const recommendedStation = useMemo(() => {
    if (!stations.length) {
      return null;
    }

    const sorted = [...stations].sort(
      (a, b) => {
        const scoreA = Number(
          a.score ??
            a.recommendationScore ??
            0
        );

        const scoreB = Number(
          b.score ??
            b.recommendationScore ??
            0
        );

        return scoreB - scoreA;
      }
    );

    return sorted[0];
  }, [stations]);

  const availableStations = useMemo(() => {
    return stations.filter((station) => {
      const status =
        String(
          station.status || ""
        ).toLowerCase();

      if (
        status === "offline" ||
        status === "full"
      ) {
        return false;
      }

      return true;
    }).length;
  }, [stations]);

  const displayName =
    user?.name ||
    user?.email?.split("@")[0] ||
    "EV Driver";

  const vehicleName = selectedVehicle
    ? `${selectedVehicle.brand || ""} ${
        selectedVehicle.model || ""
      }`.trim()
    : "No vehicle selected";

  const connector =
    selectedVehicle?.connector ||
    selectedVehicle?.connectorType ||
    "CCS2";

  const batteryCapacity = Number(
    selectedVehicle?.batteryCapacity ||
      selectedVehicle?.capacity ||
      0
  );

  return (
    <div className="smartcharge-app">

      <Navbar />

      <main className="dashboard-main">

        {/* ========================================= */}
        {/* HERO */}
        {/* ========================================= */}

        <section className="dashboard-welcome">

          <div>
            <div className="welcome-label">
              EV SMARTCHARGE DASHBOARD
            </div>

            <h1>
              Welcome back,{" "}
              <span>{displayName}</span>
            </h1>

            <p>
              Monitor your EV, discover charging
              stations and plan smarter journeys.
            </p>
          </div>

          <div className="welcome-actions">

            <button
              className="location-button"
              onClick={detectLocation}
            >
              <span className="button-icon">
                ◎
              </span>

              <span>
                <strong>
                  {currentLocation
                    ? "Location Connected"
                    : "Use My Location"}
                </strong>

                <small>
                  {locationStatus}
                </small>
              </span>
            </button>

          </div>

        </section>


        {/* ========================================= */}
        {/* STAT CARDS */}
        {/* ========================================= */}

        <section className="dashboard-stats">

          <div className="stat-card battery-stat">

            <div className="stat-icon">
              🔋
            </div>

            <div className="stat-content">

              <span className="stat-label">
                BATTERY LEVEL
              </span>

              <strong className="stat-value">
                {battery}%
              </strong>

              <span className="stat-description">
                {currentRange} km estimated range
              </span>

            </div>

            <div className="mini-progress">
              <span
                style={{
                  width: `${battery}%`,
                }}
              ></span>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon station-icon">
              ⚡
            </div>

            <div className="stat-content">

              <span className="stat-label">
                CHARGING STATIONS
              </span>

              <strong className="stat-value">
                {stationLoading
                  ? "..."
                  : stations.length}
              </strong>

              <span className="stat-description">
                {availableStations} available now
              </span>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon recommendation-icon">
              ★
            </div>

            <div className="stat-content">

              <span className="stat-label">
                BEST MATCH
              </span>

              <strong className="stat-value">
                {recommendedStation
                  ? Math.round(
                      Number(
                        recommendedStation.score ||
                          recommendedStation.recommendationScore ||
                          0
                      )
                    )
                  : "--"}
              </strong>

              <span className="stat-description">
                Smart recommendation score
              </span>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon safety-icon">
              ✓
            </div>

            <div className="stat-content">

              <span className="stat-label">
                SAFETY RESERVE
              </span>

              <strong className="stat-value">
                15%
              </strong>

              <span className="stat-description">
                Protected driving range
              </span>

            </div>

          </div>

        </section>


        {/* ========================================= */}
        {/* MAIN GRID */}
        {/* ========================================= */}

        <section className="dashboard-grid">

          {/* --------------------------------------- */}
          {/* VEHICLE CARD */}
          {/* --------------------------------------- */}

          <div className="dashboard-panel vehicle-panel">

            <div className="panel-header">

              <div>
                <span className="panel-kicker">
                  YOUR VEHICLE
                </span>

                <h2>
                  Vehicle Control
                </h2>
              </div>

              <div className="panel-header-icon">
                🚗
              </div>

            </div>


            {loading ? (
              <div className="dashboard-loading">
                Loading vehicle information...
              </div>
            ) : (
              <>
                <div className="vehicle-select-wrapper">

                  <label>
                    Select Vehicle
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
                    }}
                  >

                    {vehicles.map(
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
                          {vehicle.brand || ""}{" "}
                          {vehicle.model || ""}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="vehicle-name">
                  {vehicleName}
                </div>


                <div className="vehicle-spec-grid">

                  <div>
                    <span>
                      BATTERY
                    </span>

                    <strong>
                      {batteryCapacity ||
                        "--"}{" "}
                      kWh
                    </strong>
                  </div>

                  <div>
                    <span>
                      RANGE
                    </span>

                    <strong>
                      {selectedVehicle?.maxRange ||
                        "--"}{" "}
                      km
                    </strong>
                  </div>

                  <div>
                    <span>
                      CONNECTOR
                    </span>

                    <strong>
                      {connector}
                    </strong>
                  </div>

                  <div>
                    <span>
                      MAX SPEED
                    </span>

                    <strong>
                      {selectedVehicle?.maxChargingSpeed ||
                        selectedVehicle?.maxPower ||
                        "--"}{" "}
                      kW
                    </strong>
                  </div>

                </div>


                <div className="battery-control">

                  <div className="battery-control-header">

                    <label>
                      Current Battery
                    </label>

                    <strong>
                      {battery}%
                    </strong>

                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={battery}
                    onChange={(event) =>
                      setBattery(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                  <div className="range-labels">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>

                </div>

              </>
            )}

          </div>


          {/* --------------------------------------- */}
          {/* BATTERY CARD */}
          {/* --------------------------------------- */}

          <div className="dashboard-panel battery-panel">

            <div className="panel-header">

              <div>
                <span className="panel-kicker">
                  BATTERY STATUS
                </span>

                <h2>
                  Energy Overview
                </h2>
              </div>

              <div className="panel-header-icon">
                🔋
              </div>

            </div>


            <div className="large-battery">

              <div
                className="battery-ring"
                style={{
                  "--battery-progress":
                    `${battery * 3.6}deg`,
                }}
              >
                <div className="battery-ring-inner">

                  <strong>
                    {battery}%
                  </strong>

                  <span>
                    Battery
                  </span>

                </div>
              </div>


              <div className="battery-details">

                <div>
                  <span>
                    ESTIMATED RANGE
                  </span>

                  <strong>
                    {currentRange} km
                  </strong>
                </div>

                <div>
                  <span>
                    SAFETY RESERVE
                  </span>

                  <strong>
                    15%
                  </strong>
                </div>

                <div>
                  <span>
                    STATUS
                  </span>

                  <strong className="healthy">
                    ● Healthy
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ========================================= */}
        {/* RECOMMENDATION + ACTIVITY */}
        {/* ========================================= */}

        <section className="dashboard-lower-grid">

          {/* --------------------------------------- */}
          {/* RECOMMENDATION */}
          {/* --------------------------------------- */}

          <div className="dashboard-panel recommendation-panel">

            <div className="panel-header">

              <div>
                <span className="panel-kicker">
                  SMART RECOMMENDATION
                </span>

                <h2>
                  Best Charging Station
                </h2>
              </div>

              <NavLink
                to="/stations"
                className="panel-link"
              >
                View all
              </NavLink>

            </div>


            {stationLoading ? (
              <div className="dashboard-loading">
                Finding the best station...
              </div>
            ) : recommendedStation ? (

              <div className="recommendation-card">

                <div className="recommendation-top">

                  <div className="station-logo">
                    ⚡
                  </div>

                  <div className="station-main">

                    <span className="recommended-tag">
                      TOP RECOMMENDATION
                    </span>

                    <h3>
                      {recommendedStation.name ||
                        "EV Charging Station"}
                    </h3>

                    <p>
                      {recommendedStation.location ||
                        "Nearby charging station"}
                    </p>

                  </div>

                  <div className="smart-score">

                    <strong>
                      {Math.round(
                        Number(
                          recommendedStation.score ||
                            recommendedStation.recommendationScore ||
                            0
                        )
                      )}
                    </strong>

                    <span>
                      SCORE
                    </span>

                  </div>

                </div>


                <div className="station-details">

                  <div>
                    <span>RATING</span>
                    <strong>
                      ⭐{" "}
                      {recommendedStation.rating ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>POWER</span>
                    <strong>
                      ⚡{" "}
                      {recommendedStation.chargingSpeed ||
                        recommendedStation.maxPower ||
                        "--"}{" "}
                      kW
                    </strong>
                  </div>

                  <div>
                    <span>PRICE</span>
                    <strong>
                      ₹
                      {recommendedStation.pricePerKwh ||
                        "--"}
                      /kWh
                    </strong>
                  </div>

                  <div>
                    <span>CONNECTOR</span>
                    <strong>
                      🔌{" "}
                      {recommendedStation.connectorType ||
                        "CCS2"}
                    </strong>
                  </div>

                </div>


                <NavLink
                  to="/stations"
                  className="primary-action"
                >
                  View Station Details
                  <span>→</span>
                </NavLink>

              </div>

            ) : (

              <div className="empty-dashboard">
                <div>
                  ⚡
                </div>

                <h3>
                  No station data
                </h3>

                <p>
                  Station information could not
                  be loaded from the server.
                </p>

              </div>

            )}

          </div>


          {/* --------------------------------------- */}
          {/* QUICK ACTIONS */}
          {/* --------------------------------------- */}

          <div className="dashboard-panel quick-panel">

            <div className="panel-header">

              <div>
                <span className="panel-kicker">
                  QUICK ACTIONS
                </span>

                <h2>
                  What do you want to do?
                </h2>
              </div>

            </div>


            <div className="quick-actions">

              <NavLink
                to="/stations"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  📍
                </div>

                <div>
                  <strong>
                    Find Station
                  </strong>

                  <span>
                    Discover nearby chargers
                  </span>
                </div>

                <span className="arrow">
                  →
                </span>
              </NavLink>


              <NavLink
                to="/trips"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  🗺️
                </div>

                <div>
                  <strong>
                    Plan a Trip
                  </strong>

                  <span>
                    Find charging stops
                  </span>
                </div>

                <span className="arrow">
                  →
                </span>
              </NavLink>


              <NavLink
                to="/analytics"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  📊
                </div>

                <div>
                  <strong>
                    View Analytics
                  </strong>

                  <span>
                    Analyze station performance
                  </span>
                </div>

                <span className="arrow">
                  →
                </span>
              </NavLink>


              <NavLink
                to="/favorites"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  ♥
                </div>

                <div>
                  <strong>
                    Favorites
                  </strong>

                  <span>
                    Your saved stations
                  </span>
                </div>

                <span className="arrow">
                  →
                </span>
              </NavLink>

            </div>

          </div>

        </section>


        {/* ========================================= */}
        {/* FOOTER */}
        {/* ========================================= */}

        <footer className="dashboard-footer">

          <div>
            <strong>
              ⚡ EV SmartCharge
            </strong>

            <span>
              Intelligent EV charging
              recommendation platform.
            </span>
          </div>

          <span>
            © 2026 EV SmartCharge
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Home;