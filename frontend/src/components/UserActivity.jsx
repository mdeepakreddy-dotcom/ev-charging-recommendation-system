import React, { useEffect, useState } from "react";

function UserActivity({
  stations = [],
}) {
  const [favorites, setFavorites] =
    useState([]);

  const [tripHistory, setTripHistory] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("favorites");

  /* ======================================================
     LOAD SAVED DATA
     ====================================================== */

  useEffect(() => {
    try {
      const savedFavorites =
        localStorage.getItem(
          "evSmartChargeFavorites"
        );

      const savedTrips =
        localStorage.getItem(
          "evSmartChargeTripHistory"
        );

      if (savedFavorites) {
        setFavorites(
          JSON.parse(savedFavorites)
        );
      }

      if (savedTrips) {
        setTripHistory(
          JSON.parse(savedTrips)
        );
      }
    } catch (error) {
      console.error(
        "Unable to load saved activity:",
        error
      );
    }
  }, []);

  /* ======================================================
     SAVE FAVORITES
     ====================================================== */

  useEffect(() => {
    localStorage.setItem(
      "evSmartChargeFavorites",
      JSON.stringify(favorites)
    );
  }, [favorites]);

  /* ======================================================
     SAVE TRIP HISTORY
     ====================================================== */

  useEffect(() => {
    localStorage.setItem(
      "evSmartChargeTripHistory",
      JSON.stringify(tripHistory)
    );
  }, [tripHistory]);

  /* ======================================================
     ADD FAVORITE
     ====================================================== */

  const addFavorite = (station) => {
    const alreadySaved =
      favorites.some(
        (item) =>
          String(item.id) ===
          String(station.id)
      );

    if (alreadySaved) {
      return;
    }

    setFavorites((previous) => [
      ...previous,
      station,
    ]);
  };

  /* ======================================================
     REMOVE FAVORITE
     ====================================================== */

  const removeFavorite = (
    stationId
  ) => {
    setFavorites((previous) =>
      previous.filter(
        (station) =>
          String(station.id) !==
          String(stationId)
      )
    );
  };

  /* ======================================================
     CLEAR FAVORITES
     ====================================================== */

  const clearFavorites = () => {
    setFavorites([]);
  };

  /* ======================================================
     SAVE CURRENT STATIONS
     ====================================================== */

  const saveStationAsFavorite = (
    station
  ) => {
    addFavorite(station);
  };

  /* ======================================================
     DEMO TRIP HISTORY
     ====================================================== */

  const addDemoTrip = () => {
    const demoTrip = {
      id: Date.now(),

      start: "Hyderabad",

      destination: "Bengaluru",

      distance: 570,

      chargingStops: 3,

      chargingCost: 780,

      date: new Date().toLocaleDateString(
        "en-IN"
      ),

      time: new Date().toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
    };

    setTripHistory((previous) => [
      demoTrip,
      ...previous,
    ]);
  };

  /* ======================================================
     REMOVE TRIP
     ====================================================== */

  const removeTrip = (tripId) => {
    setTripHistory((previous) =>
      previous.filter(
        (trip) =>
          trip.id !== tripId
      )
    );
  };

  /* ======================================================
     CLEAR HISTORY
     ====================================================== */

  const clearHistory = () => {
    setTripHistory([]);
  };

  /* ======================================================
     GET FAVORITE STATUS
     ====================================================== */

  const isFavorite = (stationId) => {
    return favorites.some(
      (station) =>
        String(station.id) ===
        String(stationId)
    );
  };

  return (
    <section className="user-activity-section">

      {/* ==================================================
          SECTION HEADER
          ================================================== */}

      <div className="section-heading">

        <p>
          PERSONAL DASHBOARD
        </p>

        <h2>
          Favorites & Trip History
        </h2>

        <span>
          Save useful charging stations
          and keep track of your previous
          journeys.
        </span>

      </div>

      {/* ==================================================
          TABS
          ================================================== */}

      <div className="activity-tabs">

        <button
          type="button"
          className={
            activeTab === "favorites"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "favorites"
            )
          }
        >
          ⭐ Favorites

          <span>
            {favorites.length}
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "history"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "history"
            )
          }
        >
          🕘 Trip History

          <span>
            {tripHistory.length}
          </span>
        </button>

      </div>

      {/* ==================================================
          FAVORITES
          ================================================== */}

      {activeTab ===
        "favorites" && (
        <div className="activity-card">

          <div className="activity-card-header">

            <div>
              <span>
                SAVED STATIONS
              </span>

              <h3>
                Your Favorite Chargers
              </h3>
            </div>

            {favorites.length > 0 && (
              <button
                type="button"
                className="activity-clear-button"
                onClick={
                  clearFavorites
                }
              >
                Clear All
              </button>
            )}

          </div>

          {stations.length > 0 && (
            <div className="favorite-add-area">

              <div>
                <small>
                  QUICK ADD
                </small>

                <strong>
                  Save a charging station
                </strong>
              </div>

              <select
                defaultValue=""
                onChange={(event) => {
                  const station =
                    stations.find(
                      (item) =>
                        String(
                          item.id
                        ) ===
                        event.target
                          .value
                    );

                  if (station) {
                    saveStationAsFavorite(
                      station
                    );

                    event.target.value =
                      "";
                  }
                }}
              >
                <option value="">
                  Select station...
                </option>

                {stations.map(
                  (station) => (
                    <option
                      key={station.id}
                      value={station.id}
                      disabled={isFavorite(
                        station.id
                      )}
                    >
                      {station.name}
                      {isFavorite(
                        station.id
                      )
                        ? " ✓"
                        : ""}
                    </option>
                  )
                )}

              </select>

            </div>
          )}

          {favorites.length === 0 ? (
            <div className="activity-empty">

              <div>
                ⭐
              </div>

              <h3>
                No favorite stations
              </h3>

              <p>
                Save charging stations
                you use frequently for
                quick access later.
              </p>

            </div>
          ) : (
            <div className="favorite-list">

              {favorites.map(
                (station) => (
                  <div
                    className="favorite-item"
                    key={station.id}
                  >

                    <div className="favorite-icon">
                      ⚡
                    </div>

                    <div className="favorite-main">

                      <h4>
                        {station.name}
                      </h4>

                      <p>
                        📍{" "}
                        {station.location}
                      </p>

                      <div className="favorite-details">

                        <span>
                          ⭐{" "}
                          {station.rating ||
                            "N/A"}
                        </span>

                        <span>
                          ⚡{" "}
                          {station.chargingSpeed ||
                            "--"}{" "}
                          kW
                        </span>

                        <span>
                          ₹
                          {station.pricePerKwh ||
                            "--"}
                          /kWh
                        </span>

                      </div>

                    </div>

                    <button
                      type="button"
                      className="favorite-remove"
                      onClick={() =>
                        removeFavorite(
                          station.id
                        )
                      }
                      title="Remove favorite"
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      )}

      {/* ==================================================
          TRIP HISTORY
          ================================================== */}

      {activeTab ===
        "history" && (
        <div className="activity-card">

          <div className="activity-card-header">

            <div>
              <span>
                PREVIOUS JOURNEYS
              </span>

              <h3>
                Trip History
              </h3>
            </div>

            <div className="history-actions">

              <button
                type="button"
                className="demo-trip-button"
                onClick={
                  addDemoTrip
                }
              >
                + Add Test Trip
              </button>

              {tripHistory.length >
                0 && (
                <button
                  type="button"
                  className="activity-clear-button"
                  onClick={
                    clearHistory
                  }
                >
                  Clear All
                </button>
              )}

            </div>

          </div>

          {tripHistory.length ===
          0 ? (
            <div className="activity-empty">

              <div>
                🕘
              </div>

              <h3>
                No trip history
              </h3>

              <p>
                Your completed trip
                plans will appear
                here.
              </p>

            </div>
          ) : (
            <div className="trip-history-list">

              {tripHistory.map(
                (trip) => (
                  <div
                    className="trip-history-item"
                    key={trip.id}
                  >

                    <div className="history-route">

                      <div className="history-location">
                        <span className="history-dot start" />

                        <div>
                          <small>
                            FROM
                          </small>

                          <strong>
                            {trip.start}
                          </strong>
                        </div>
                      </div>

                      <div className="history-line" />

                      <div className="history-location">
                        <span className="history-dot destination" />

                        <div>
                          <small>
                            TO
                          </small>

                          <strong>
                            {
                              trip.destination
                            }
                          </strong>
                        </div>
                      </div>

                    </div>

                    <div className="history-stats">

                      <div>
                        <small>
                          DISTANCE
                        </small>

                        <strong>
                          {
                            trip.distance
                          }{" "}
                          km
                        </strong>
                      </div>

                      <div>
                        <small>
                          CHARGING STOPS
                        </small>

                        <strong>
                          {
                            trip.chargingStops
                          }
                        </strong>
                      </div>

                      <div>
                        <small>
                          CHARGING COST
                        </small>

                        <strong>
                          ₹
                          {
                            trip.chargingCost
                          }
                        </strong>
                      </div>

                      <div>
                        <small>
                          DATE
                        </small>

                        <strong>
                          {trip.date}
                        </strong>
                      </div>

                    </div>

                    <button
                      type="button"
                      className="history-remove"
                      onClick={() =>
                        removeTrip(
                          trip.id
                        )
                      }
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      )}

    </section>
  );
}

export default UserActivity;