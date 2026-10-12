import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./TripHistory.css";
import { API_BASE_URL } from "../services/config";

const TOKEN_KEY = "evSmartChargeToken";

function formatDate(dateValue) {
  if (!dateValue) return "Recently";

  try {
    return new Date(dateValue).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Recently";
  }
}

function formatMinutes(minutes) {
  const value = Number(minutes || 0);

  if (value < 60) {
    return `${Math.round(value)} min`;
  }

  const hours = Math.floor(value / 60);
  const remaining = Math.round(value % 60);

  return remaining > 0
    ? `${hours} hr ${remaining} min`
    : `${hours} hr`;
}

function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem(TOKEN_KEY);

  const loadTrips = async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("Please login to view trip history.");
      }

      const response = await fetch(
        `${API_BASE_URL}/trip-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load trip history."
        );
      }

      setTrips(
        Array.isArray(data)
          ? data
          : data.trips || data.tripHistory || []
      );
    } catch (err) {
      console.error("Trip history error:", err);

      setTrips([]);

      setError(
        err.message || "Unable to load trip history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const deleteTrip = async (tripId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trip?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/trip-history/${encodeURIComponent(
          tripId
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete trip."
        );
      }

      setMessage("Trip deleted successfully.");

      await loadTrips();
    } catch (err) {
      setError(
        err.message || "Unable to delete trip."
      );
    }
  };

  const clearAllTrips = async () => {
    if (trips.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all trip history?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/trip-history`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to clear trip history."
        );
      }

      setTrips([]);
      setMessage(
        "Trip history cleared successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to clear trip history."
      );
    }
  };

  const totalTrips = trips.length;

  const totalDistance = trips.reduce(
    (total, trip) =>
      total +
      Number(
        trip.distanceKm ||
          trip.distance ||
          trip.totalDistance ||
          0
      ),
    0
  );

  const totalCost = trips.reduce(
    (total, trip) =>
      total +
      Number(
        trip.totalChargingCost ||
          trip.chargingCost ||
          trip.cost ||
          0
      ),
    0
  );

  if (loading) {
    return (
      <div className="trip-history-page">
        <div className="trip-history-loading">
          <div className="trip-history-spinner"></div>
          <h2>Loading Trip History</h2>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-history-page">

      {/* HEADER */}

      <div className="trip-history-header">

        <div>
          <span className="trip-history-label">
            YOUR JOURNEY RECORD
          </span>

          <h1>
            Trip History
          </h1>

          <p>
            View your previous EV trips,
            charging stops, distance and cost.
          </p>
        </div>

        <div className="trip-history-actions">

          <Link
            to="/trip-planner"
            className="trip-history-primary-btn"
          >
            + Plan New Trip
          </Link>

          {trips.length > 0 && (
            <button
              type="button"
              className="trip-history-danger-btn"
              onClick={clearAllTrips}
            >
              Clear History
            </button>
          )}

        </div>

      </div>

      {/* MESSAGE */}

      {error && (
        <div className="trip-history-message error">
          ⚠ {error}
        </div>
      )}

      {message && (
        <div className="trip-history-message success">
          ✓ {message}
        </div>
      )}

      {/* SUMMARY */}

      <div className="trip-history-summary">

        <div className="trip-summary-card">

          <div className="trip-summary-icon">
            🚗
          </div>

          <div>
            <span>
              Total Trips
            </span>

            <strong>
              {totalTrips}
            </strong>
          </div>

        </div>

        <div className="trip-summary-card">

          <div className="trip-summary-icon">
            📍
          </div>

          <div>
            <span>
              Distance Covered
            </span>

            <strong>
              {totalDistance.toFixed(1)} km
            </strong>
          </div>

        </div>

        <div className="trip-summary-card">

          <div className="trip-summary-icon">
            ₹
          </div>

          <div>
            <span>
              Charging Cost
            </span>

            <strong>
              ₹{totalCost.toFixed(0)}
            </strong>
          </div>

        </div>

      </div>

      {/* EMPTY STATE */}

      {trips.length === 0 ? (

        <div className="trip-history-empty">

          <div className="trip-history-empty-icon">
            🛣️
          </div>

          <h2>
            No trips yet
          </h2>

          <p>
            Your completed trip plans will
            appear here after you plan a journey.
          </p>

          <Link
            to="/trip-planner"
            className="trip-history-primary-btn"
          >
            Plan Your First Trip
          </Link>

        </div>

      ) : (

        /* TRIP LIST */

        <div className="trip-history-list">

          {trips.map((trip, index) => {

            const tripId =
              trip.id ||
              trip.tripId ||
              trip.trip_id ||
              index;

            const start =
              trip.startLocation ||
              trip.start ||
              trip.origin ||
              "Starting Point";

            const destination =
              trip.destination ||
              trip.destinationLocation ||
              trip.endLocation ||
              trip.end ||
              "Destination";

            const distance =
              Number(
                trip.distanceKm ||
                  trip.distance ||
                  trip.totalDistance ||
                  0
              );

            const cost =
              Number(
                trip.totalChargingCost ||
                  trip.chargingCost ||
                  trip.cost ||
                  0
              );

            const chargingTime =
              Number(
                trip.totalChargingTimeMinutes ||
                  trip.chargingTimeMinutes ||
                  trip.chargingTime ||
                  0
              );

            const stops =
              Number(
                trip.numberOfStops ||
                  trip.chargingStops ||
                  trip.stops ||
                  0
              );

            const vehicle =
              trip.vehicleName ||
              trip.vehicle ||
              "EV Vehicle";

            const battery =
              trip.batteryPercentage ??
              trip.battery ??
              trip.startBattery;

            const createdAt =
              trip.createdAt ||
              trip.created_at ||
              trip.date;

            return (
              <article
                key={tripId}
                className="trip-history-card"
              >

                {/* CARD HEADER */}

                <div className="trip-card-header">

                  <div className="trip-card-number">
                    Trip #{index + 1}
                  </div>

                  <span className="trip-card-date">
                    {formatDate(createdAt)}
                  </span>

                </div>

                {/* ROUTE */}

                <div className="trip-route">

                  <div className="trip-route-point">

                    <div className="trip-route-dot start">
                      A
                    </div>

                    <div>
                      <span>
                        FROM
                      </span>

                      <strong>
                        {start}
                      </strong>
                    </div>

                  </div>

                  <div className="trip-route-line">
                    ↓
                  </div>

                  <div className="trip-route-point">

                    <div className="trip-route-dot destination">
                      B
                    </div>

                    <div>
                      <span>
                        TO
                      </span>

                      <strong>
                        {destination}
                      </strong>
                    </div>

                  </div>

                </div>

                {/* DETAILS */}

                <div className="trip-card-details">

                  <div className="trip-detail">

                    <span>
                      Distance
                    </span>

                    <strong>
                      {distance.toFixed(1)} km
                    </strong>

                  </div>

                  <div className="trip-detail">

                    <span>
                      Charging Stops
                    </span>

                    <strong>
                      {stops}
                    </strong>

                  </div>

                  <div className="trip-detail">

                    <span>
                      Charging Cost
                    </span>

                    <strong>
                      ₹{cost.toFixed(0)}
                    </strong>

                  </div>

                  <div className="trip-detail">

                    <span>
                      Charging Time
                    </span>

                    <strong>
                      {formatMinutes(
                        chargingTime
                      )}
                    </strong>

                  </div>

                </div>

                {/* VEHICLE INFO */}

                <div className="trip-vehicle">

                  <div>
                    <span>
                      Vehicle
                    </span>

                    <strong>
                      🚙 {vehicle}
                    </strong>
                  </div>

                  {battery !== undefined &&
                    battery !== null && (
                      <div>
                        <span>
                          Starting Battery
                        </span>

                        <strong>
                          🔋 {battery}%
                        </strong>
                      </div>
                    )}

                </div>

                {/* FOOTER */}

                <div className="trip-card-footer">

                  <span className="trip-completed">
                    ✓ Trip Recorded
                  </span>

                  <button
                    type="button"
                    className="trip-delete-btn"
                    onClick={() =>
                      deleteTrip(tripId)
                    }
                  >
                    🗑 Remove
                  </button>

                </div>

              </article>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default TripHistory;