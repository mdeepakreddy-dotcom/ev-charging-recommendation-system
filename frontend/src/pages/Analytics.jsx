import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Analytics.css";

const API_BASE_URL = "http://localhost:3000/api";

function Analytics() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/stations`
        );

        if (!response.ok) {
          throw new Error("Unable to load station data.");
        }

        const data = await response.json();

        const stationList = Array.isArray(data)
          ? data
          : Array.isArray(data.stations)
          ? data.stations
          : [];

        setStations(stationList);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load analytics data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, []);

  const analytics = useMemo(() => {
    const total = stations.length;

    const available = stations.filter(
      (station) =>
        String(station.status || "")
          .toLowerCase() === "available"
    ).length;

    const busy = stations.filter(
      (station) =>
        String(station.status || "")
          .toLowerCase() === "busy"
    ).length;

    const full = stations.filter(
      (station) =>
        String(station.status || "")
          .toLowerCase() === "full"
    ).length;

    const offline = stations.filter(
      (station) =>
        String(station.status || "")
          .toLowerCase() === "offline"
    ).length;

    const chargingSpeeds = stations
      .map((station) =>
        Number(
          station.chargingPower ??
            station.maxPower ??
            station.power ??
            0
        )
      )
      .filter((value) => value > 0);

    const prices = stations
      .map((station) =>
        Number(
          station.pricePerKwh ??
            station.price ??
            0
        )
      )
      .filter((value) => value > 0);

    const ratings = stations
      .map((station) =>
        Number(station.rating || 0)
      )
      .filter((value) => value > 0);

    const totalConnectors = stations.reduce(
      (count, station) => {
        const connectors =
          station.connectors ||
          station.connectorTypes ||
          station.connector;

        if (Array.isArray(connectors)) {
          return count + connectors.length;
        }

        return count + 1;
      },
      0
    );

    const averageSpeed =
      chargingSpeeds.length > 0
        ? chargingSpeeds.reduce(
            (sum, value) => sum + value,
            0
          ) / chargingSpeeds.length
        : 0;

    const averagePrice =
      prices.length > 0
        ? prices.reduce(
            (sum, value) => sum + value,
            0
          ) / prices.length
        : 0;

    const averageRating =
      ratings.length > 0
        ? ratings.reduce(
            (sum, value) => sum + value,
            0
          ) / ratings.length
        : 0;

    const availabilityRate =
      total > 0
        ? (available / total) * 100
        : 0;

    const statusData = [
      {
        name: "Available",
        count: available,
        className: "available",
      },
      {
        name: "Busy",
        count: busy,
        className: "busy",
      },
      {
        name: "Full",
        count: full,
        className: "full",
      },
      {
        name: "Offline",
        count: offline,
        className: "offline",
      },
    ];

    const connectorMap = {};

    stations.forEach((station) => {
      let connector =
        station.connectorType ||
        station.connector ||
        "Unknown";

      if (Array.isArray(connector)) {
        connector.forEach((item) => {
          const name = String(item || "Unknown");
          connectorMap[name] =
            (connectorMap[name] || 0) + 1;
        });
      } else {
        connector = String(connector);
        connectorMap[connector] =
          (connectorMap[connector] || 0) + 1;
      }
    });

    const connectorData = Object.entries(
      connectorMap
    )
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const speedRanges = [
      {
        label: "Up to 30 kW",
        min: 0,
        max: 30,
      },
      {
        label: "31–60 kW",
        min: 30,
        max: 60,
      },
      {
        label: "61–120 kW",
        min: 60,
        max: 120,
      },
      {
        label: "120+ kW",
        min: 120,
        max: Infinity,
      },
    ];

    const speedData = speedRanges.map(
      (range) => ({
        label: range.label,
        count: chargingSpeeds.filter(
          (speed) =>
            speed > range.min &&
            speed <= range.max
        ).length,
      })
    );

    const priceRanges = [
      {
        label: "₹0–₹10",
        min: 0,
        max: 10,
      },
      {
        label: "₹11–₹12",
        min: 10,
        max: 12,
      },
      {
        label: "₹13–₹15",
        min: 12,
        max: 15,
      },
      {
        label: "₹16+",
        min: 15,
        max: Infinity,
      },
    ];

    const priceData = priceRanges.map(
      (range) => ({
        label: range.label,
        count: prices.filter(
          (price) =>
            price > range.min &&
            price <= range.max
        ).length,
      })
    );

    return {
      total,
      available,
      busy,
      full,
      offline,
      averageSpeed,
      averagePrice,
      averageRating,
      totalConnectors,
      availabilityRate,
      statusData,
      connectorData,
      speedData,
      priceData,
    };
  }, [stations]);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="analytics-spinner"></div>

          <h2>
            Loading Analytics
          </h2>

          <p>
            Analyzing charging station
            network data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <div className="error-icon">
            ⚠
          </div>

          <h2>
            Analytics Unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* HERO */}

      <section className="analytics-hero">

        <div>
          <div className="analytics-eyebrow">
            EV SMARTCHARGE
          </div>

          <h1>
            Charging Network
            <span> Analytics</span>
          </h1>

          <p>
            Monitor charging station
            availability, performance,
            pricing and network health
            from one dashboard.
          </p>
        </div>

        <div className="analytics-hero-action">
          <Link to="/stations">
            View Stations
          </Link>
        </div>

      </section>


      {/* KPI CARDS */}

      <section className="analytics-kpi-grid">

        <div className="analytics-kpi-card">

          <div className="kpi-icon">
            ⚡
          </div>

          <div className="kpi-content">
            <span>
              Total Stations
            </span>

            <strong>
              {analytics.total}
            </strong>

            <small>
              Charging locations
            </small>
          </div>

        </div>


        <div className="analytics-kpi-card">

          <div className="kpi-icon green">
            ●
          </div>

          <div className="kpi-content">
            <span>
              Available Now
            </span>

            <strong>
              {analytics.available}
            </strong>

            <small>
              {analytics.availabilityRate.toFixed(
                1
              )}
              % availability
            </small>
          </div>

        </div>


        <div className="analytics-kpi-card">

          <div className="kpi-icon blue">
            ⚙
          </div>

          <div className="kpi-content">
            <span>
              Avg. Charging Speed
            </span>

            <strong>
              {analytics.averageSpeed.toFixed(
                1
              )}{" "}
              kW
            </strong>

            <small>
              Network average
            </small>
          </div>

        </div>


        <div className="analytics-kpi-card">

          <div className="kpi-icon orange">
            ₹
          </div>

          <div className="kpi-content">
            <span>
              Avg. Charging Price
            </span>

            <strong>
              ₹
              {analytics.averagePrice.toFixed(
                2
              )}
            </strong>

            <small>
              Per kWh
            </small>
          </div>

        </div>


        <div className="analytics-kpi-card">

          <div className="kpi-icon purple">
            ★
          </div>

          <div className="kpi-content">
            <span>
              Average Rating
            </span>

            <strong>
              {analytics.averageRating.toFixed(
                1
              )}
            </strong>

            <small>
              Station rating
            </small>
          </div>

        </div>


        <div className="analytics-kpi-card">

          <div className="kpi-icon cyan">
            🔌
          </div>

          <div className="kpi-content">
            <span>
              Connectors
            </span>

            <strong>
              {analytics.totalConnectors}
            </strong>

            <small>
              Available connections
            </small>
          </div>

        </div>

      </section>


      {/* MAIN ANALYTICS GRID */}

      <section className="analytics-grid">

        {/* STATUS */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <span className="card-label">
                NETWORK STATUS
              </span>

              <h2>
                Station Availability
              </h2>
            </div>

            <div className="header-badge">
              Live
            </div>

          </div>

          <div className="status-chart">

            {analytics.statusData.map(
              (item) => {

                const percentage =
                  analytics.total > 0
                    ? (item.count /
                        analytics.total) *
                      100
                    : 0;

                return (
                  <div
                    className="status-row"
                    key={item.name}
                  >

                    <div className="status-info">

                      <span
                        className={`status-dot ${item.className}`}
                      ></span>

                      <span>
                        {item.name}
                      </span>

                      <strong>
                        {item.count}
                      </strong>

                    </div>

                    <div className="status-bar">

                      <div
                        className={`status-bar-fill ${item.className}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      ></div>

                    </div>

                    <span className="status-percentage">
                      {percentage.toFixed(0)}%
                    </span>

                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* CONNECTORS */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <span className="card-label">
                INFRASTRUCTURE
              </span>

              <h2>
                Connector Distribution
              </h2>
            </div>

          </div>

          <div className="connector-list">

            {analytics.connectorData.length ===
            0 ? (
              <div className="empty-chart">
                No connector data available.
              </div>
            ) : (
              analytics.connectorData.map(
                (item, index) => {

                  const percentage =
                    analytics.total > 0
                      ? (item.count /
                          analytics.total) *
                        100
                      : 0;

                  return (
                    <div
                      className="connector-row"
                      key={`${item.name}-${index}`}
                    >

                      <div className="connector-top">

                        <span>
                          {item.name}
                        </span>

                        <strong>
                          {item.count}
                        </strong>

                      </div>

                      <div className="connector-track">

                        <div
                          className="connector-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        ></div>

                      </div>

                    </div>
                  );
                }
              )
            )}

          </div>

        </div>


        {/* CHARGING SPEED */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <span className="card-label">
                PERFORMANCE
              </span>

              <h2>
                Charging Speed
              </h2>
            </div>

          </div>

          <div className="vertical-chart">

            {analytics.speedData.map(
              (item) => {

                const maxValue =
                  Math.max(
                    ...analytics.speedData.map(
                      (data) =>
                        data.count
                    ),
                    1
                  );

                const height =
                  (item.count /
                    maxValue) *
                  100;

                return (
                  <div
                    className="chart-column"
                    key={item.label}
                  >

                    <div className="column-value">
                      {item.count}
                    </div>

                    <div className="column-track">

                      <div
                        className="column-fill"
                        style={{
                          height: `${height}%`,
                        }}
                      ></div>

                    </div>

                    <span>
                      {item.label}
                    </span>

                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* PRICING */}

        <div className="analytics-card">

          <div className="analytics-card-header">

            <div>
              <span className="card-label">
                COST ANALYSIS
              </span>

              <h2>
                Charging Price
              </h2>
            </div>

          </div>

          <div className="price-chart">

            {analytics.priceData.map(
              (item) => {

                const maxValue =
                  Math.max(
                    ...analytics.priceData.map(
                      (data) =>
                        data.count
                    ),
                    1
                  );

                const width =
                  (item.count /
                    maxValue) *
                  100;

                return (
                  <div
                    className="price-row"
                    key={item.label}
                  >

                    <div className="price-label">
                      {item.label}
                    </div>

                    <div className="price-track">

                      <div
                        className="price-fill"
                        style={{
                          width: `${width}%`,
                        }}
                      ></div>

                    </div>

                    <strong>
                      {item.count}
                    </strong>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </section>


      {/* NETWORK SUMMARY */}

      <section className="network-summary">

        <div className="summary-content">

          <div className="summary-icon">
            ✓
          </div>

          <div>

            <span className="card-label">
              NETWORK HEALTH
            </span>

            <h2>
              EV Charging Network
              Overview
            </h2>

            <p>
              {analytics.available} of{" "}
              {analytics.total} stations
              are currently available.
              The network has an average
              charging speed of{" "}
              {analytics.averageSpeed.toFixed(
                1
              )}{" "}
              kW and an average price of
              ₹
              {analytics.averagePrice.toFixed(
                2
              )}{" "}
              per kWh.
            </p>

          </div>

        </div>


        <div className="summary-stats">

          <div>
            <strong>
              {analytics.availabilityRate.toFixed(
                0
              )}%
            </strong>

            <span>
              Availability
            </span>
          </div>

          <div>
            <strong>
              {analytics.averageSpeed.toFixed(
                0
              )}
              kW
            </strong>

            <span>
              Avg Speed
            </span>
          </div>

          <div>
            <strong>
              ₹
              {analytics.averagePrice.toFixed(
                1
              )}
            </strong>

            <span>
              Avg Price
            </span>
          </div>

        </div>

      </section>


      {/* FOOTER ACTIONS */}

      <section className="analytics-actions">

        <Link to="/stations">
          Explore Charging Stations
          <span>→</span>
        </Link>

        <Link to="/trips">
          Plan a Long Trip
          <span>→</span>
        </Link>

      </section>

    </div>
  );
}

export default Analytics;