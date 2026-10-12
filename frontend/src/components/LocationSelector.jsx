import React, { useState } from "react";

import {
  searchLocation,
} from "../services/api";

function LocationSelector({
  location,
  setLocation,
}) {
  const [manualLocation, setManualLocation] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
          name: "Current Location",
        });

        setManualLocation(
          "Current Location"
        );

        setLoading(false);
      },
      (error) => {
        console.error(error);

        setError(
          "Unable to get your current location. Please allow location access or search manually."
        );

        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualSearch = async () => {
    if (!manualLocation.trim()) {
      setError(
        "Please enter a location."
      );
      return;
    }

    setError("");
    setResults([]);
    setLoading(true);

    try {
      const data =
        await searchLocation(
          manualLocation
        );

      if (
        !data.results ||
        data.results.length === 0
      ) {
        setError(
          "Location not found. Please try another location."
        );
        return;
      }

      setResults(data.results);
    } catch (err) {
      console.error(
        "Location search error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to search location."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (
    result
  ) => {
    setLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      name:
        result.name ||
        result.displayName,
    });

    setManualLocation(
      result.displayName
    );

    setResults([]);
    setError("");
  };

  return (
    <div className="location-selector">

      <div className="location-header">
        <div>
          <p className="section-label">
            LOCATION
          </p>

          <h2>
            Choose Your Location
          </h2>

          <p>
            Use your current GPS location or
            search for a location manually.
          </p>
        </div>

        <div className="location-icon">
          📍
        </div>
      </div>

      <div className="location-controls">

        <button
          type="button"
          className="current-location-button"
          onClick={
            handleCurrentLocation
          }
          disabled={loading}
        >
          📍{" "}
          {loading
            ? "Getting Location..."
            : "Use Current Location"}
        </button>

        <div className="location-search">

          <input
            type="text"
            value={manualLocation}
            onChange={(event) => {
              setManualLocation(
                event.target.value
              );
              setResults([]);
              setError("");
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                handleManualSearch();
              }
            }}
            placeholder="Search city or location..."
          />

          <button
            type="button"
            onClick={
              handleManualSearch
            }
            disabled={loading}
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>

        </div>

      </div>

      {results.length > 0 && (
        <div className="location-search-results">

          {results.map(
            (result, index) => (
              <button
                type="button"
                key={`${result.latitude}-${result.longitude}-${index}`}
                className="location-result-item"
                onClick={() =>
                  handleSelectLocation(
                    result
                  )
                }
              >
                <span className="location-result-icon">
                  📍
                </span>

                <span>
                  <strong>
                    {result.name}
                  </strong>

                  <small>
                    {
                      result.displayName
                    }
                  </small>
                </span>
              </button>
            )
          )}

        </div>
      )}

      {location &&
        location.latitude !== null &&
        location.longitude !== null && (
          <div className="selected-location-display">
            <span>✓</span>

            <div>
              <small>
                Selected Location
              </small>

              <strong>
                {location.name ||
                  "Selected Location"}
              </strong>

              <p>
                {Number(
                  location.latitude
                ).toFixed(5)}
                ,{" "}
                {Number(
                  location.longitude
                ).toFixed(5)}
              </p>
            </div>
          </div>
        )}

      {error && (
        <div className="location-error">
          ⚠️ {error}
        </div>
      )}

    </div>
  );
}

export default LocationSelector;