import React, { useEffect, useMemo } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

/* =========================================================
   CUSTOM MARKER ICONS
   ========================================================= */

const createStationIcon = (status) => {
  let background = "#20a66f";

  if (status === "Busy") {
    background = "#e6a528";
  }

  if (status === "Full") {
    background = "#e35d5d";
  }

  if (status === "Offline") {
    background = "#7d8794";
  }

  return L.divIcon({
    className: "custom-station-marker",

    html: `
      <div
        style="
          width:34px;
          height:34px;
          border-radius:50%;
          background:${background};
          border:4px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.25);
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:16px;
          font-weight:800;
        "
      >
        ⚡
      </div>
    `,

    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

const userIcon = L.divIcon({
  className: "custom-user-marker",

  html: `
    <div
      style="
        width:40px;
        height:40px;
        border-radius:50%;
        background:#1769aa;
        border:4px solid white;
        box-shadow:0 3px 14px rgba(0,0,0,0.3);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:18px;
      "
    >
      📍
    </div>
  `,

  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

/* =========================================================
   MAP BOUNDS COMPONENT
   ========================================================= */

function MapBounds({
  location,
  stations,
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      return;
    }

    const points = [
      [
        Number(location.latitude),
        Number(location.longitude),
      ],
    ];

    stations.forEach((station) => {
      if (
        station.latitude !== undefined &&
        station.longitude !== undefined
      ) {
        points.push([
          Number(station.latitude),
          Number(station.longitude),
        ]);
      }
    });

    if (points.length > 1) {
      const bounds =
        L.latLngBounds(points);

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 13,
      });
    } else {
      map.setView(
        [
          Number(location.latitude),
          Number(location.longitude),
        ],
        13
      );
    }
  }, [map, location, stations]);

  return null;
}

/* =========================================================
   STATION MAP
   ========================================================= */

function StationMap({
  location,
  stations = [],
}) {
  const validStations = useMemo(() => {
    return stations.filter(
      (station) =>
        station.latitude !== undefined &&
        station.longitude !== undefined
    );
  }, [stations]);

  if (
    !location ||
    location.latitude === null ||
    location.longitude === null
  ) {
    return (
      <div className="map-placeholder">
        <div className="map-placeholder-content">

          <span className="map-placeholder-icon">
            🗺️
          </span>

          <h3>
            Charging Network Map
          </h3>

          <p>
            Select your location and find
            charging stations to display the
            charging network.
          </p>

        </div>
      </div>
    );
  }

  const userPosition = [
    Number(location.latitude),
    Number(location.longitude),
  ];

  return (
    <div className="station-map-wrapper">

      {/* MAP HEADER */}

      <div className="map-topbar">

        <div>
          <span className="map-topbar-label">
            LIVE NETWORK
          </span>

          <strong>
            {validStations.length} Charging
            Stations
          </strong>
        </div>

        <div className="map-topbar-location">
          📍{" "}
          {location.name ||
            "Selected Location"}
        </div>

      </div>

      {/* MAP */}

      <div className="station-map">

        <MapContainer
          center={userPosition}
          zoom={12}
          scrollWheelZoom={true}
          style={{
            height: "500px",
            width: "100%",
          }}
        >

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBounds
            location={location}
            stations={validStations}
          />

          {/* USER SEARCH AREA */}

          <Circle
            center={userPosition}
            radius={500}
            pathOptions={{
              color: "#1769aa",
              fillColor: "#1769aa",
              fillOpacity: 0.08,
              weight: 2,
            }}
          />

          {/* USER LOCATION */}

          <Marker
            position={userPosition}
            icon={userIcon}
          >
            <Popup>

              <div className="station-popup user-popup">

                <h3>
                  📍 Your Location
                </h3>

                <p>
                  Current selected vehicle
                  location.
                </p>

                <hr />

                <small>
                  Latitude:{" "}
                  {Number(
                    location.latitude
                  ).toFixed(5)}
                </small>

                <br />

                <small>
                  Longitude:{" "}
                  {Number(
                    location.longitude
                  ).toFixed(5)}
                </small>

              </div>

            </Popup>
          </Marker>

          {/* STATIONS */}

          {validStations.map(
            (station) => {

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

              const availability =
                total > 0
                  ? Math.round(
                      (available /
                        total) *
                        100
                    )
                  : 0;

              return (
                <Marker
                  key={station.id}
                  position={[
                    Number(
                      station.latitude
                    ),
                    Number(
                      station.longitude
                    ),
                  ]}
                  icon={createStationIcon(
                    station.status
                  )}
                >

                  <Popup>

                    <div className="station-popup">

                      <div className="popup-station-title">

                        <div>
                          <span>
                            ⚡
                          </span>

                          <div>
                            <h3>
                              {
                                station.name
                              }
                            </h3>

                            <small>
                              {
                                station.location
                              }
                            </small>
                          </div>
                        </div>

                        <span
                          className={`map-status ${String(
                            station.status ||
                              ""
                          )
                            .toLowerCase()
                            .replace(
                              " ",
                              "-"
                            )}`}
                        >
                          {
                            station.status
                          }
                        </span>

                      </div>

                      <hr />

                      {/* DISTANCE */}

                      <div className="popup-metric-grid">

                        <div>
                          <small>
                            DISTANCE
                          </small>

                          <strong>
                            {station.distance ??
                              "--"}{" "}
                            km
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
                            CHARGING
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
                            /kWh
                          </strong>
                        </div>

                      </div>

                      {/* AVAILABILITY */}

                      <div className="popup-availability">

                        <div>
                          <span>
                            Charger
                            Availability
                          </span>

                          <strong>
                            {available}/
                            {total}
                          </strong>
                        </div>

                        <div className="popup-progress">
                          <div
                            style={{
                              width: `${availability}%`,
                            }}
                          />
                        </div>

                      </div>

                      {/* WAIT */}

                      <div className="popup-info-row">

                        <span>
                          ⏱️ Waiting time
                        </span>

                        <strong>
                          {
                            station.waitingTime
                          }{" "}
                          min
                        </strong>

                      </div>

                      {/* CONNECTORS */}

                      <div className="popup-connectors">

                        <span>
                          🔌 Connectors
                        </span>

                        <div>
                          {(
                            station.connectors ||
                            []
                          ).map(
                            (
                              connector
                            ) => (
                              <span
                                key={
                                  connector
                                }
                              >
                                {
                                  connector
                                }
                              </span>
                            )
                          )}
                        </div>

                      </div>

                      {/* SCORE */}

                      {station.score !==
                        undefined && (
                        <div className="popup-score">

                          <span>
                            Smart Match
                            Score
                          </span>

                          <strong>
                            {Math.round(
                              Number(
                                station.score
                              )
                            )}
                            /100
                          </strong>

                        </div>
                      )}

                    </div>

                  </Popup>

                </Marker>
              );
            }
          )}

        </MapContainer>

        {/* MAP LEGEND */}

        <div className="map-legend">

          <div className="map-legend-title">
            STATION STATUS
          </div>

          <div className="legend-item">
            <span className="legend-dot available" />
            Available
          </div>

          <div className="legend-item">
            <span className="legend-dot busy" />
            Busy
          </div>

          <div className="legend-item">
            <span className="legend-dot full" />
            Full
          </div>

          <div className="legend-item">
            <span className="legend-dot offline" />
            Offline
          </div>

          <div className="legend-divider" />

          <div className="legend-item">
            <span className="legend-user">
              📍
            </span>
            Your Location
          </div>

        </div>

      </div>

    </div>
  );
}

export default StationMap;