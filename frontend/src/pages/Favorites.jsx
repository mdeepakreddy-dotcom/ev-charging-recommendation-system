import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../services/config";

import "./Favorites.css";

const TOKEN_KEY =
  "evSmartChargeToken";


function Favorites() {

  const [stations, setStations] =
    useState([]);

  const [favoriteStations, setFavoriteStations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* =========================================================
     AUTH TOKEN
     ========================================================= */

  const getToken = () => {
    return localStorage.getItem(
      TOKEN_KEY
    );
  };


  /* =========================================================
     AUTH HEADERS
     ========================================================= */

  const getAuthHeaders = () => {

    const token =
      getToken();

    return {
      "Content-Type":
        "application/json",

      Authorization:
        `Bearer ${token}`,
    };
  };


  /* =========================================================
     LOAD ALL STATIONS
     ========================================================= */

  const loadStations = async () => {

    const response =
      await fetch(
        `${API_BASE_URL}/stations`
      );

    if (!response.ok) {
      throw new Error(
        "Unable to load charging stations."
      );
    }

    const data =
      await response.json();

    const stationList =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data.stations
          )
        ? data.stations
        : [];

    setStations(
      stationList
    );
  };


  /* =========================================================
     LOAD USER FAVORITES
     ========================================================= */

  const loadFavorites = async () => {

    const token =
      getToken();

    if (!token) {
      throw new Error(
        "Please login to view your favorite stations."
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/favorites`,
        {
          method: "GET",

          headers:
            getAuthHeaders(),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
          "Unable to load your favorites."
      );
    }

    setFavoriteStations(
      Array.isArray(
        data.favorites
      )
        ? data.favorites
        : []
    );
  };


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {

    const loadData =
      async () => {

        try {

          setLoading(true);
          setError("");

          await Promise.all([
            loadStations(),
            loadFavorites(),
          ]);

        } catch (err) {

          console.error(
            "Favorites loading error:",
            err
          );

          setError(
            err.message ||
              "Unable to load favorites."
          );

        } finally {

          setLoading(false);

        }
      };


    loadData();

  }, []);


  /* =========================================================
     SUCCESS MESSAGE
     ========================================================= */

  const showSuccess =
    (message) => {

      setSuccessMessage(
        message
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    };


  /* =========================================================
     ADD FAVORITE
     ========================================================= */

  const addFavorite =
    async (station) => {

      const stationId =
        station.id ??
        station.stationId;

      if (
        stationId === undefined ||
        stationId === null
      ) {
        return;
      }

      try {

        setActionLoading(
          `add-${stationId}`
        );

        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/favorites`,
            {
              method: "POST",

              headers:
                getAuthHeaders(),

              body: JSON.stringify({
                stationId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to save favorite."
          );
        }

        await loadFavorites();

        showSuccess(
          "Station added to favorites."
        );

      } catch (err) {

        console.error(
          "Add favorite error:",
          err
        );

        setError(
          err.message ||
            "Unable to save favorite."
        );

      } finally {

        setActionLoading("");

      }
    };


  /* =========================================================
     REMOVE FAVORITE
     ========================================================= */

  const removeFavorite =
    async (station) => {

      const stationId =
        station.id ??
        station.stationId;

      if (
        stationId === undefined ||
        stationId === null
      ) {
        return;
      }

      try {

        setActionLoading(
          `remove-${stationId}`
        );

        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/favorites/${encodeURIComponent(
              stationId
            )}`,
            {
              method: "DELETE",

              headers:
                getAuthHeaders(),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to remove favorite."
          );
        }

        await loadFavorites();

        showSuccess(
          "Station removed from favorites."
        );

      } catch (err) {

        console.error(
          "Remove favorite error:",
          err
        );

        setError(
          err.message ||
            "Unable to remove favorite."
        );

      } finally {

        setActionLoading("");

      }
    };


  /* =========================================================
     CLEAR ALL FAVORITES
     ========================================================= */

  const clearFavorites =
    async () => {

      if (
        favoriteStations.length ===
        0
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to remove all favorite stations?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setActionLoading(
          "clear"
        );

        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/favorites`,
            {
              method: "DELETE",

              headers:
                getAuthHeaders(),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to clear favorites."
          );
        }

        setFavoriteStations([]);

        showSuccess(
          "All favorite stations were removed."
        );

      } catch (err) {

        console.error(
          "Clear favorites error:",
          err
        );

        setError(
          err.message ||
            "Unable to clear favorites."
        );

      } finally {

        setActionLoading("");

      }
    };


  /* =========================================================
     CHECK FAVORITE
     ========================================================= */

  const favoriteIdSet =
    useMemo(() => {

      return new Set(
        favoriteStations.map(
          (station) =>
            String(
              station.id ??
                station.stationId
            )
        )
      );

    }, [favoriteStations]);


  const isFavorite =
    (station) => {

      const stationId =
        station.id ??
        station.stationId;

      return favoriteIdSet.has(
        String(stationId)
      );
    };


  /* =========================================================
     STATION STATUS
     ========================================================= */

  const getStatus =
    (station) => {

      const status =
        String(
          station.status ||
            ""
        ).toLowerCase();


      if (
        status ===
        "available"
      ) {
        return "Available";
      }


      if (
        status ===
        "busy"
      ) {
        return "Busy";
      }


      if (
        status ===
        "full"
      ) {
        return "Full";
      }


      if (
        status ===
        "offline"
      ) {
        return "Offline";
      }


      if (
        station.availableChargers !==
          undefined &&
        Number(
          station.availableChargers
        ) > 0
      ) {
        return "Available";
      }


      if (
        station.availableSlots !==
          undefined &&
        Number(
          station.availableSlots
        ) > 0
      ) {
        return "Available";
      }


      return "Unknown";
    };


  /* =========================================================
     STATUS CLASS
     ========================================================= */

  const getStatusClass =
    (station) => {

      return getStatus(
        station
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          "-"
        );
    };


  /* =========================================================
     POWER
     ========================================================= */

  const getPower =
    (station) => {

      const power =
        station.chargingPower ??
        station.chargingSpeed ??
        station.maxPower ??
        station.power ??
        0;

      return Number(power) > 0
        ? `${power} kW`
        : "N/A";
    };


  /* =========================================================
     PRICE
     ========================================================= */

  const getPrice =
    (station) => {

      const price =
        station.pricePerKwh ??
        station.price;


      if (
        price === undefined ||
        price === null ||
        price === ""
      ) {
        return "N/A";
      }


      const numericPrice =
        Number(price);


      if (
        !Number.isFinite(
          numericPrice
        )
      ) {
        return "N/A";
      }


      return `₹${numericPrice.toFixed(
        2
      )}/kWh`;
    };


  /* =========================================================
     RATING
     ========================================================= */

  const getRating =
    (station) => {

      const rating =
        Number(
          station.rating || 0
        );


      return rating > 0
        ? rating.toFixed(1)
        : "N/A";
    };


  /* =========================================================
     CONNECTOR
     ========================================================= */

  const getConnector =
    (station) => {

      const connector =
        station.connectorType ??
        station.connector ??
        station.connectors;


      if (
        Array.isArray(
          connector
        )
      ) {
        return connector.join(
          ", "
        );
      }


      return (
        connector ||
        "CCS2"
      );
    };


  /* =========================================================
     ADDRESS
     ========================================================= */

  const getAddress =
    (station) => {

      if (
        typeof station.location ===
        "string"
      ) {
        return station.location;
      }


      return (
        station.address ||
        station.location?.address ||
        station.location?.name ||
        station.city ||
        "Location details unavailable"
      );
    };


  /* =========================================================
     LOADING SCREEN
     ========================================================= */

  if (loading) {

    return (
      <div className="favorites-page">

        <Navbar />

        <main className="favorites-main">

          <div className="favorites-loading">

            <div className="favorites-spinner"></div>

            <h2>
              Loading Favorites
            </h2>

            <p>
              Loading your saved
              charging stations...
            </p>

          </div>

        </main>

      </div>
    );
  }


  /* =========================================================
     ERROR SCREEN
     ========================================================= */

  if (
    error &&
    favoriteStations.length ===
      0 &&
    stations.length ===
      0
  ) {

    return (
      <div className="favorites-page">

        <Navbar />

        <main className="favorites-main">

          <div className="favorites-error">

            <div className="favorites-error-icon">
              ⚠
            </div>

            <h2>
              Unable to Load Favorites
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

        </main>

      </div>
    );
  }


  /* =========================================================
     CALCULATED VALUES
     ========================================================= */

  const availableCount =
    favoriteStations.filter(
      (station) =>
        getStatus(
          station
        ) === "Available"
    ).length;


  const fastChargerCount =
    favoriteStations.filter(
      (station) => {

        const power =
          Number(
            station.chargingPower ??
              station.chargingSpeed ??
              station.maxPower ??
              station.power ??
              0
          );

        return power >= 60;
      }
    ).length;


  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="favorites-page">

      <Navbar />


      {/* =====================================================
         SUCCESS MESSAGE
         ===================================================== */}

      {successMessage && (

        <div className="favorites-toast success">
          ✓ {successMessage}
        </div>

      )}


      {/* =====================================================
         ERROR MESSAGE
         ===================================================== */}

      {error && (

        <div className="favorites-toast error">
          ⚠ {error}
        </div>

      )}


      <main className="favorites-main">


        {/* ===================================================
           PAGE HEADER
           =================================================== */}

        <section className="favorites-header">

          <div>

            <div className="favorites-eyebrow">
              EV SMARTCHARGE
            </div>

            <h1>
              Your{" "}
              <span>
                Favorite Stations
              </span>
            </h1>

            <p>
              Quickly access the charging
              stations you use most often.
            </p>

          </div>


          <div className="favorites-header-actions">

            {favoriteStations.length >
              0 && (

              <button
                className="clear-favorites-btn"
                onClick={
                  clearFavorites
                }
                disabled={
                  actionLoading ===
                  "clear"
                }
              >
                {actionLoading ===
                "clear"
                  ? "Clearing..."
                  : "Clear All"}
              </button>

            )}


            <Link
              to="/stations"
              className="browse-stations-btn"
            >
              Browse Stations
              <span>→</span>
            </Link>

          </div>

        </section>


        {/* ===================================================
           SUMMARY
           =================================================== */}

        <section className="favorites-summary">


          <div className="favorites-summary-card">

            <div className="summary-favorite-icon">
              ★
            </div>

            <div>

              <span>
                Saved Stations
              </span>

              <strong>
                {
                  favoriteStations.length
                }
              </strong>

            </div>

          </div>


          <div className="favorites-summary-card">

            <div className="summary-favorite-icon green">
              ●
            </div>

            <div>

              <span>
                Available Now
              </span>

              <strong>
                {
                  availableCount
                }
              </strong>

            </div>

          </div>


          <div className="favorites-summary-card">

            <div className="summary-favorite-icon blue">
              ⚡
            </div>

            <div>

              <span>
                Fast Chargers
              </span>

              <strong>
                {
                  fastChargerCount
                }
              </strong>

            </div>

          </div>


        </section>


        {/* ===================================================
           EMPTY STATE
           =================================================== */}

        {favoriteStations.length ===
          0 && (

          <section className="favorites-empty">

            <div className="empty-star">
              ☆
            </div>

            <h2>
              No Favorite Stations Yet
            </h2>

            <p>
              Save charging stations
              you frequently use so you
              can find them quickly later.
            </p>

            <Link to="/stations">
              Explore Charging Stations
              <span>
                →
              </span>
            </Link>

          </section>

        )}


        {/* ===================================================
           FAVORITE STATIONS
           =================================================== */}

        {favoriteStations.length >
          0 && (

          <section className="favorites-grid">

            {favoriteStations.map(
              (station) => {

                const stationId =
                  station.id ??
                  station.stationId;

                return (

                  <article
                    className="favorite-station-card"
                    key={stationId}
                  >


                    <div className="favorite-card-top">

                      <div className="favorite-station-icon">
                        ⚡
                      </div>


                      <button
                        className="favorite-star active"
                        onClick={() =>
                          removeFavorite(
                            station
                          )
                        }
                        disabled={
                          actionLoading ===
                          `remove-${stationId}`
                        }
                        title="Remove from favorites"
                      >
                        {actionLoading ===
                        `remove-${stationId}`
                          ? "..."
                          : "★"}
                      </button>

                    </div>


                    <div className="favorite-station-main">

                      <h2>
                        {
                          station.name ||
                          station.stationName ||
                          "Charging Station"
                        }
                      </h2>

                      <p className="favorite-address">
                        📍{" "}
                        {getAddress(
                          station
                        )}
                      </p>

                    </div>


                    <div className="favorite-status">

                      <span
                        className={`favorite-status-dot ${getStatusClass(
                          station
                        )}`}
                      ></span>

                      <span>
                        {
                          getStatus(
                            station
                          )
                        }
                      </span>

                    </div>


                    <div className="favorite-details">


                      <div>

                        <span>
                          Charging
                        </span>

                        <strong>
                          {
                            getPower(
                              station
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Price
                        </span>

                        <strong>
                          {
                            getPrice(
                              station
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Rating
                        </span>

                        <strong>
                          ★{" "}
                          {
                            getRating(
                              station
                            )
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Connector
                        </span>

                        <strong>
                          {
                            getConnector(
                              station
                            )
                          }
                        </strong>

                      </div>

                    </div>


                    <div className="favorite-card-actions">

                      <Link
                        to="/stations"
                        className="view-station-btn"
                      >
                        View Station
                      </Link>


                      <Link
                        to="/trips"
                        className="plan-trip-btn"
                      >
                        Plan Trip
                      </Link>

                    </div>

                  </article>

                );
              }
            )}

          </section>

        )}


        {/* ===================================================
           DISCOVER MORE
           =================================================== */}

        <section className="save-more-section">


          <div className="save-more-header">

            <div>

              <span className="favorites-eyebrow">
                DISCOVER MORE
              </span>

              <h2>
                Add Stations to Favorites
              </h2>

              <p>
                Choose from available
                charging stations.
              </p>

            </div>


            <Link to="/stations">
              View All
              <span>
                →
              </span>
            </Link>

          </div>


          <div className="available-stations-list">

            {stations
              .filter(
                (station) =>
                  !isFavorite(
                    station
                  )
              )
              .slice(0, 4)
              .map(
                (station) => {

                  const stationId =
                    station.id ??
                    station.stationId;

                  const adding =
                    actionLoading ===
                    `add-${stationId}`;

                  return (

                    <div
                      className="available-station-row"
                      key={stationId}
                    >


                      <div className="available-station-info">

                        <div className="mini-station-icon">
                          ⚡
                        </div>


                        <div>

                          <h3>
                            {
                              station.name ||
                              station.stationName ||
                              "Charging Station"
                            }
                          </h3>

                          <p>
                            {
                              getAddress(
                                station
                              )
                            }
                          </p>

                        </div>

                      </div>


                      <div className="mini-station-stats">

                        <span>
                          ⚡{" "}
                          {
                            getPower(
                              station
                            )
                          }
                        </span>

                        <span>
                          ★{" "}
                          {
                            getRating(
                              station
                            )
                          }
                        </span>

                        <span>
                          {
                            getPrice(
                              station
                            )
                          }
                        </span>

                      </div>


                      <button
                        className="add-favorite-btn"
                        onClick={() =>
                          addFavorite(
                            station
                          )
                        }
                        disabled={
                          adding
                        }
                      >
                        {adding
                          ? "Saving..."
                          : "+ Save"}
                      </button>

                    </div>

                  );
                }
              )}

          </div>

        </section>


        <footer className="favorites-footer">

          <strong>
            ⚡ EV SmartCharge
          </strong>

          <span>
            Intelligent EV charging
            • Smart recommendations
            • Better journeys
          </span>

        </footer>


      </main>

    </div>
  );
}


export default Favorites;