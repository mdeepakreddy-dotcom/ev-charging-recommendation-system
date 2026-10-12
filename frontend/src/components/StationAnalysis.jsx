import React, { useMemo, useState } from "react";

function StationAnalysis({
  stations = [],
  location,
  selectedVehicle,
}) {
  const [connectorFilter, setConnectorFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [maxDistance, setMaxDistance] =
    useState(100);

  const [minSpeed, setMinSpeed] =
    useState(0);

  const [minRating, setMinRating] =
    useState(0);

  const [maxPrice, setMaxPrice] =
    useState(100);

  const [sortBy, setSortBy] =
    useState("score");

  const [showFilters, setShowFilters] =
    useState(true);

  /* ======================================================
     CONNECTOR LIST
     ====================================================== */

  const connectorOptions = useMemo(() => {
    const connectors = new Set();

    stations.forEach((station) => {
      if (Array.isArray(station.connectors)) {
        station.connectors.forEach(
          (connector) =>
            connectors.add(connector)
        );
      }

      if (station.connectorType) {
        connectors.add(
          station.connectorType
        );
      }
    });

    return [
      "All",
      ...Array.from(connectors).sort(),
    ];
  }, [stations]);

  /* ======================================================
     STATUS
     ====================================================== */

  const getStatus = (station) => {
    if (
      station.open === false ||
      station.fault === true ||
      station.status === "Offline"
    ) {
      return "Offline";
    }

    const available =
      Number(
        station.availableChargers || 0
      );

    const total =
      Number(
        station.totalChargers || 0
      );

    if (available <= 0) {
      return "Full";
    }

    if (
      total > 0 &&
      available / total < 0.35
    ) {
      return "Busy";
    }

    return "Available";
  };

  /* ======================================================
     FILTER + SORT
     ====================================================== */

  const filteredStations = useMemo(() => {
    let result = [...stations];

    result = result.filter(
      (station) => {
        const distance =
          Number(
            station.distance || 0
          );

        const speed =
          Number(
            station.chargingSpeed || 0
          );

        const rating =
          Number(
            station.rating || 0
          );

        const price =
          Number(
            station.pricePerKwh || 0
          );

        const status =
          getStatus(station);

        const connectors =
          Array.isArray(
            station.connectors
          )
            ? station.connectors
            : station.connectorType
              ? [
                  station.connectorType,
                ]
              : [];

        const connectorMatch =
          connectorFilter === "All" ||
          connectors.some(
            (connector) =>
              String(
                connector
              ).toLowerCase() ===
              connectorFilter.toLowerCase()
          );

        const statusMatch =
          statusFilter === "All" ||
          status === statusFilter;

        return (
          distance <=
            Number(maxDistance) &&
          speed >=
            Number(minSpeed) &&
          rating >=
            Number(minRating) &&
          price <=
            Number(maxPrice) &&
          connectorMatch &&
          statusMatch
        );
      }
    );

    result.sort(
      (a, b) => {
        if (sortBy === "distance") {
          return (
            Number(a.distance || 0) -
            Number(b.distance || 0)
          );
        }

        if (sortBy === "price") {
          return (
            Number(
              a.pricePerKwh || 0
            ) -
            Number(
              b.pricePerKwh || 0
            )
          );
        }

        if (sortBy === "speed") {
          return (
            Number(
              b.chargingSpeed || 0
            ) -
            Number(
              a.chargingSpeed || 0
            )
          );
        }

        if (sortBy === "rating") {
          return (
            Number(b.rating || 0) -
            Number(a.rating || 0)
          );
        }

        return (
          Number(b.score || 0) -
          Number(a.score || 0)
        );
      }
    );

    return result;
  }, [
    stations,
    connectorFilter,
    statusFilter,
    maxDistance,
    minSpeed,
    minRating,
    maxPrice,
    sortBy,
  ]);

  /* ======================================================
     RESET
     ====================================================== */

  const resetFilters = () => {
    setConnectorFilter("All");
    setStatusFilter("All");
    setMaxDistance(100);
    setMinSpeed(0);
    setMinRating(0);
    setMaxPrice(100);
    setSortBy("score");
  };

  /* ======================================================
     STATUS COUNTS
     ====================================================== */

  const availableCount =
    stations.filter(
      (station) =>
        getStatus(station) ===
        "Available"
    ).length;

  const busyCount =
    stations.filter(
      (station) =>
        getStatus(station) === "Busy"
    ).length;

  const fullCount =
    stations.filter(
      (station) =>
        getStatus(station) === "Full"
    ).length;

  const offlineCount =
    stations.filter(
      (station) =>
        getStatus(station) ===
        "Offline"
    ).length;

  return (
    <section className="station-analysis-section">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="section-heading">

        <p>
          STATION ANALYSIS
        </p>

        <h2>
          Compare Charging Stations
        </h2>

        <span>
          Filter and compare charging
          stations based on your EV
          requirements.
        </span>

      </div>

      {/* ==================================================
          EMPTY STATE
          ================================================== */}

      {stations.length === 0 ? (
        <div className="station-empty-state">

          <div>
            ⚡
          </div>

          <h3>
            No station analysis yet
          </h3>

          <p>
            Select your location and
            click "Find Best Charging
            Station" to analyze nearby
            charging stations.
          </p>

        </div>
      ) : (
        <>
          {/* ==================================================
              SUMMARY
              ================================================== */}

          <div className="station-status-summary">

            <div className="station-summary-card">
              <span className="summary-dot available" />

              <div>
                <small>
                  AVAILABLE
                </small>

                <strong>
                  {availableCount}
                </strong>
              </div>
            </div>

            <div className="station-summary-card">
              <span className="summary-dot busy" />

              <div>
                <small>
                  BUSY
                </small>

                <strong>
                  {busyCount}
                </strong>
              </div>
            </div>

            <div className="station-summary-card">
              <span className="summary-dot full" />

              <div>
                <small>
                  FULL
                </small>

                <strong>
                  {fullCount}
                </strong>
              </div>
            </div>

            <div className="station-summary-card">
              <span className="summary-dot offline" />

              <div>
                <small>
                  OFFLINE
                </small>

                <strong>
                  {offlineCount}
                </strong>
              </div>
            </div>

          </div>

          {/* ==================================================
              FILTER CARD
              ================================================== */}

          <div className="station-filter-card">

            <div className="station-filter-header">

              <div>
                <span>
                  FILTERS & SORTING
                </span>

                <h3>
                  Find the right charger
                </h3>
              </div>

              <div className="station-filter-actions">

                <button
                  type="button"
                  onClick={resetFilters}
                  className="reset-filter-button"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(
                      !showFilters
                    )
                  }
                  className="toggle-filter-button"
                >
                  {showFilters
                    ? "Hide Filters"
                    : "Show Filters"}
                </button>

              </div>

            </div>

            {showFilters && (
              <div className="station-filter-body">

                {/* CONNECTOR */}

                <div className="filter-group">

                  <label>
                    Connector
                  </label>

                  <select
                    value={
                      connectorFilter
                    }
                    onChange={(event) =>
                      setConnectorFilter(
                        event.target.value
                      )
                    }
                  >
                    {connectorOptions.map(
                      (connector) => (
                        <option
                          key={connector}
                          value={connector}
                        >
                          {connector}
                        </option>
                      )
                    )}
                  </select>

                </div>

                {/* STATUS */}

                <div className="filter-group">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      statusFilter
                    }
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="All">
                      All Status
                    </option>

                    <option value="Available">
                      Available
                    </option>

                    <option value="Busy">
                      Busy
                    </option>

                    <option value="Full">
                      Full
                    </option>

                    <option value="Offline">
                      Offline
                    </option>
                  </select>

                </div>

                {/* SORT */}

                <div className="filter-group">

                  <label>
                    Sort By
                  </label>

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value
                      )
                    }
                  >
                    <option value="score">
                      Best Match
                    </option>

                    <option value="distance">
                      Nearest
                    </option>

                    <option value="price">
                      Lowest Price
                    </option>

                    <option value="speed">
                      Fastest Charging
                    </option>

                    <option value="rating">
                      Highest Rating
                    </option>
                  </select>

                </div>

                {/* DISTANCE */}

                <div className="filter-range-group">

                  <div>
                    <label>
                      Maximum Distance
                    </label>

                    <strong>
                      {maxDistance} km
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={
                      maxDistance
                    }
                    onChange={(event) =>
                      setMaxDistance(
                        event.target.value
                      )
                    }
                  />

                </div>

                {/* SPEED */}

                <div className="filter-range-group">

                  <div>
                    <label>
                      Minimum Charging Speed
                    </label>

                    <strong>
                      {minSpeed} kW
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={minSpeed}
                    onChange={(event) =>
                      setMinSpeed(
                        event.target.value
                      )
                    }
                  />

                </div>

                {/* RATING */}

                <div className="filter-range-group">

                  <div>
                    <label>
                      Minimum Rating
                    </label>

                    <strong>
                      {minRating === 0
                        ? "Any"
                        : `${minRating}+ ⭐`}
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(event) =>
                      setMinRating(
                        event.target.value
                      )
                    }
                  />

                </div>

                {/* PRICE */}

                <div className="filter-range-group">

                  <div>
                    <label>
                      Maximum Price
                    </label>

                    <strong>
                      ₹{maxPrice}/kWh
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={maxPrice}
                    onChange={(event) =>
                      setMaxPrice(
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>
            )}

          </div>

          {/* ==================================================
              RESULTS HEADER
              ================================================== */}

          <div className="station-results-header">

            <div>
              <strong>
                {filteredStations.length}
              </strong>{" "}
              stations match your filters
            </div>

            <span>
              {selectedVehicle
                ? `${selectedVehicle.brand} ${selectedVehicle.model} • ${selectedVehicle.connectorType}`
                : "Vehicle not selected"}
            </span>

          </div>

          {/* ==================================================
              STATION LIST
              ================================================== */}

          {filteredStations.length ===
          0 ? (
            <div className="station-no-results">

              <div>
                🔎
              </div>

              <h3>
                No stations match
              </h3>

              <p>
                Try increasing the
                distance or reducing
                your filter requirements.
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
              >
                Reset Filters
              </button>

            </div>
          ) : (
            <div className="station-analysis-list">

              {filteredStations.map(
                (
                  station,
                  index
                ) => {
                  const status =
                    getStatus(
                      station
                    );

                  const available =
                    Number(
                      station.availableChargers ||
                        0
                    );

                  const total =
                    Number(
                      station.totalChargers ||
                        0
                    );

                  const percentage =
                    total > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (available /
                              total) *
                              100
                          )
                        )
                      : 0;

                  const connectors =
                    Array.isArray(
                      station.connectors
                    )
                      ? station.connectors
                      : station.connectorType
                        ? [
                            station.connectorType,
                          ]
                        : [];

                  return (
                    <div
                      className={`station-analysis-card ${
                        index === 0
                          ? "top-station"
                          : ""
                      }`}
                      key={
                        station.id ||
                        station.name
                      }
                    >

                      {/* RANK */}

                      <div className="station-rank">
                        <span>
                          #{index + 1}
                        </span>

                        {index === 0 && (
                          <small>
                            BEST MATCH
                          </small>
                        )}
                      </div>

                      {/* MAIN */}

                      <div className="station-analysis-main">

                        <div className="station-analysis-title">

                          <div>
                            <h3>
                              ⚡{" "}
                              {
                                station.name
                              }
                            </h3>

                            <p>
                              📍{" "}
                              {
                                station.location
                              }
                            </p>
                          </div>

                          <span
                            className={`station-status-badge ${status.toLowerCase()}`}
                          >
                            {status}
                          </span>

                        </div>

                        <div className="station-analysis-metrics">

                          <div>
                            <small>
                              DISTANCE
                            </small>

                            <strong>
                              {
                                station.distance
                              }{" "}
                              km
                            </strong>
                          </div>

                          <div>
                            <small>
                              SPEED
                            </small>

                            <strong>
                              {
                                station.chargingSpeed
                              }{" "}
                              kW
                            </strong>
                          </div>

                          <div>
                            <small>
                              PRICE
                            </small>

                            <strong>
                              ₹
                              {
                                station.pricePerKwh
                              }
                            </strong>
                          </div>

                          <div>
                            <small>
                              WAIT
                            </small>

                            <strong>
                              {
                                station.waitingTime
                              }{" "}
                              min
                            </strong>
                          </div>

                          <div>
                            <small>
                              RATING
                            </small>

                            <strong>
                              ⭐{" "}
                              {
                                station.rating
                              }
                            </strong>
                          </div>

                          <div>
                            <small>
                              MATCH
                            </small>

                            <strong>
                              {Math.round(
                                Number(
                                  station.score ||
                                    0
                                )
                              )}
                            </strong>
                          </div>

                        </div>

                        <div className="station-analysis-bottom">

                          <div className="station-connectors">

                            <span>
                              CONNECTORS
                            </span>

                            <div>
                              {connectors.map(
                                (
                                  connector
                                ) => (
                                  <b
                                    key={
                                      connector
                                    }
                                  >
                                    {
                                      connector
                                    }
                                  </b>
                                )
                              )}
                            </div>

                          </div>

                          <div className="station-availability">

                            <div>
                              <span>
                                CHARGERS
                              </span>

                              <strong>
                                {available}/
                                {total}
                              </strong>
                            </div>

                            <div className="station-progress">
                              <div
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </>
      )}

      {/* ==================================================
          LOCATION NOTE
          ================================================== */}

      {location &&
        location.name && (
          <div className="station-analysis-note">
            <span>
              📍
            </span>

            <p>
              Station analysis is based on
              your selected location:{" "}
              <strong>
                {location.name}
              </strong>
            </p>
          </div>
        )}

    </section>
  );
}

export default StationAnalysis;