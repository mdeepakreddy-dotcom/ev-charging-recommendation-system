import React, { useEffect, useMemo, useState } from "react";

import { NavLink } from "react-router-dom";

import {

  MapContainer,

  TileLayer,

  Marker,

  Popup,

  useMap,

} from "react-leaflet";

import L from "leaflet";



import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../services/config";

import "./Stations.css";



import "leaflet/dist/leaflet.css";



const API_URL = API_BASE_URL;





// =====================================================

// FIX LEAFLET MARKER ICON

// =====================================================



delete L.Icon.Default.prototype._getIconUrl;



L.Icon.Default.mergeOptions({

  iconRetinaUrl:

    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",



  iconUrl:

    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",



  shadowUrl:

    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

});





// =====================================================

// MAP LOCATION CONTROLLER

// =====================================================



function MapController({ location }) {

  const map = useMap();



  useEffect(() => {

    if (

      location &&

      location.latitude !== undefined &&

      location.longitude !== undefined

    ) {

      map.flyTo(

        [

          Number(location.latitude),

          Number(location.longitude),

        ],

        12,

        {

          duration: 1.2,

        }

      );

    }

  }, [location, map]);



  return null;

}





// =====================================================

// STATION PAGE

// =====================================================



function Stations() {

  const [stations, setStations] = useState([]);



  const [loading, setLoading] = useState(true);



  const [selectedStation, setSelectedStation] =

    useState(null);



  const [search, setSearch] = useState("");



  const [statusFilter, setStatusFilter] =

    useState("All");



  const [connectorFilter, setConnectorFilter] =

    useState("All");



  const [speedFilter, setSpeedFilter] =

    useState("All");



  const [location, setLocation] =

    useState({

      latitude: 17.385,

      longitude: 78.4867,

    });



  const [locationMessage, setLocationMessage] =

    useState("Hyderabad");



  const [favoriteStations, setFavoriteStations] =

    useState(() => {

      try {

        return JSON.parse(

          localStorage.getItem(

            "evSmartChargeFavorites"

          ) || "[]"

        );

      } catch {

        return [];

      }

    });





  // ===================================================

  // LOAD STATIONS

  // ===================================================



  useEffect(() => {

    loadStations();

  }, []);





  async function loadStations() {

    try {

      setLoading(true);



      const response = await fetch(

        `${API_URL}/stations`

      );



      if (!response.ok) {

        throw new Error(

          "Unable to load stations."

        );

      }



      const data =

        await response.json();



      const stationList =

        Array.isArray(data)

          ? data

          : data?.stations || [];



      setStations(stationList);



      if (stationList.length > 0) {

        setSelectedStation(

          stationList[0]

        );

      }



    } catch (error) {

      console.error(

        "Station loading error:",

        error

      );



      setStations([]);



    } finally {

      setLoading(false);

    }

  }





  // ===================================================

  // GET CURRENT LOCATION

  // ===================================================



  function detectLocation() {

    if (!navigator.geolocation) {

      setLocationMessage(

        "Location is not supported by this browser."

      );



      return;

    }



    setLocationMessage(

      "Detecting your location..."

    );



    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =

          position.coords.latitude;



        const longitude =

          position.coords.longitude;



        setLocation({

          latitude,

          longitude,

        });



        setLocationMessage(

          "Current location"

        );

      },



      () => {

        setLocationMessage(

          "Unable to access location."

        );

      }

    );

  }





  // ===================================================

  // NORMALIZE STATION DATA

  // ===================================================



  function normalizeStation(station, index) {

    const status =

      station.status ||

      (

        station.available !== undefined

          ? Number(station.available) > 0

            ? "Available"

            : "Full"

          : "Available"

      );



    const power = Number(

      station.chargingSpeed ||

        station.maxPower ||

        station.power ||

        0

    );



    const price = Number(

      station.pricePerKwh ||

        station.price ||

        0

    );



    const rating = Number(

      station.rating || 0

    );



    const score = Number(

      station.score ??

        station.recommendationScore ??

        0

    );



    const connector =

      station.connectorType ||

      station.connector ||

      "CCS2";



    const latitude = Number(

      station.latitude ??

        station.lat ??

        station.coordinates?.latitude ??

        station.location?.latitude ??

        17.385 + index * 0.01

    );



    const longitude = Number(

      station.longitude ??

        station.lng ??

        station.lon ??

        station.coordinates?.longitude ??

        station.location?.longitude ??

        78.4867 + index * 0.01

    );



    return {

      ...station,



      id:

        station.id ||

        station._id ||

        `station-${index}`,



      name:

        station.name ||

        "EV Charging Station",



      address:

        station.location ||

        station.address ||

        "Hyderabad",



      status,



      power,



      price,



      rating,



      score,



      connector,



      latitude,



      longitude,



      available:

        Number(

          station.available ??

            station.availableConnectors ??

            station.availableSlots ??

            0

        ),



      total:

        Number(

          station.total ??

            station.totalConnectors ??

            station.totalSlots ??

            0

        ),



      waitTime:

        Number(

          station.waitTime ??

            station.waitingTime ??

            0

        ),

    };

  }





  const normalizedStations =

    useMemo(() => {

      return stations.map(

        normalizeStation

      );

    }, [stations]);





  // ===================================================

  // FILTER STATIONS

  // ===================================================



  const filteredStations =

    useMemo(() => {

      return normalizedStations.filter(

        (station) => {



          const searchText =

            search

              .trim()

              .toLowerCase();



          const matchesSearch =

            !searchText ||

            station.name

              .toLowerCase()

              .includes(searchText) ||

            station.address

              .toLowerCase()

              .includes(searchText);



          const matchesStatus =

            statusFilter === "All" ||

            station.status ===

              statusFilter;



          const matchesConnector =

            connectorFilter === "All" ||

            station.connector

              .toUpperCase() ===

              connectorFilter

                .toUpperCase();



          const matchesSpeed =

            speedFilter === "All" ||

            (

              speedFilter === "Fast" &&

              station.power >= 60

            ) ||

            (

              speedFilter === "Medium" &&

              station.power >= 30 &&

              station.power < 60

            ) ||

            (

              speedFilter === "Slow" &&

              station.power < 30

            );



          return (

            matchesSearch &&

            matchesStatus &&

            matchesConnector &&

            matchesSpeed

          );

        }

      );

    }, [

      normalizedStations,

      search,

      statusFilter,

      connectorFilter,

      speedFilter,

    ]);





  // ===================================================

  // BEST STATION

  // ===================================================



  const recommendedStation =

    useMemo(() => {



      if (

        !filteredStations.length

      ) {

        return null;

      }



      return [

        ...filteredStations,

      ].sort(

        (a, b) =>

          b.score - a.score

      )[0];



    }, [filteredStations]);





  // ===================================================

  // FAVORITES

  // ===================================================



  function navigateToStation(station) {
    const destinationLatitude = Number(station?.latitude ?? station?.lat ?? station?.coordinates?.latitude ?? station?.location?.latitude);
    const destinationLongitude = Number(station?.longitude ?? station?.lng ?? station?.lon ?? station?.coordinates?.longitude ?? station?.location?.longitude);

    if (!Number.isFinite(destinationLatitude) || !Number.isFinite(destinationLongitude)) {
      window.alert("Google Maps navigation is unavailable because this station has no valid coordinates.");
      return;
    }

    const originLatitude = Number(location?.latitude);
    const originLongitude = Number(location?.longitude);
    const params = new URLSearchParams({
      api: "1",
      destination: `${destinationLatitude},${destinationLongitude}`,
      travelmode: "driving",
    });

    if (Number.isFinite(originLatitude) && Number.isFinite(originLongitude)) {
      params.set("origin", `${originLatitude},${originLongitude}`);
    }

    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank", "noopener,noreferrer");
  }


  function toggleFavorite(station) {

    const stationId = String(

      station.id

    );



    let updated;



    if (

      favoriteStations.includes(

        stationId

      )

    ) {

      updated =

        favoriteStations.filter(

          (id) =>

            id !== stationId

        );

    } else {

      updated = [

        ...favoriteStations,

        stationId,

      ];

    }



    setFavoriteStations(updated);



    localStorage.setItem(

      "evSmartChargeFavorites",

      JSON.stringify(updated)

    );

  }





  function isFavorite(station) {

    return favoriteStations.includes(

      String(station.id)

    );

  }





  // ===================================================

  // RESET FILTERS

  // ===================================================



  function resetFilters() {

    setSearch("");

    setStatusFilter("All");

    setConnectorFilter("All");

    setSpeedFilter("All");

  }





  // ===================================================

  // STATISTICS

  // ===================================================



  const availableCount =

    normalizedStations.filter(

      (station) =>

        station.status ===

        "Available"

    ).length;



  const fastCount =

    normalizedStations.filter(

      (station) =>

        station.power >= 60

    ).length;



  const averageRating =

    normalizedStations.length

      ? (

          normalizedStations.reduce(

            (sum, station) =>

              sum +

              station.rating,

            0

          ) /

          normalizedStations.length

        ).toFixed(1)

      : "0.0";





  // ===================================================

  // RENDER

  // ===================================================



  return (

    <div className="stations-page">



      <Navbar />





      <main className="stations-main">



        {/* ========================================= */}

        {/* HEADER */}

        {/* ========================================= */}



        <section className="stations-header">



          <div>



            <span className="stations-eyebrow">

              CHARGING NETWORK

            </span>



            <h1>

              Find a Charging Station

            </h1>



            <p>

              Discover nearby EV chargers,

              compare stations and find the

              smartest charging option.

            </p>



          </div>





          <button

            className="stations-location-button"

            onClick={detectLocation}

          >



            <span className="location-symbol">

              ◎

            </span>



            <span>

              <strong>

                {locationMessage}

              </strong>



              <small>

                Use current location

              </small>

            </span>



          </button>



        </section>





        {/* ========================================= */}

        {/* STATISTICS */}

        {/* ========================================= */}



        <section className="station-summary">



          <div className="network-stat">



            <span className="network-stat-icon">

              ⚡

            </span>



            <div>

              <small>

                TOTAL STATIONS

              </small>



              <strong>

                {normalizedStations.length}

              </strong>

            </div>



          </div>





          <div className="network-stat">



            <span className="network-stat-icon available">

              ●

            </span>



            <div>

              <small>

                AVAILABLE NOW

              </small>



              <strong>

                {availableCount}

              </strong>

            </div>



          </div>





          <div className="network-stat">



            <span className="network-stat-icon fast">

              ⚡

            </span>



            <div>

              <small>

                FAST CHARGERS

              </small>



              <strong>

                {fastCount}

              </strong>

            </div>



          </div>





          <div className="network-stat">



            <span className="network-stat-icon rating">

              ★

            </span>



            <div>

              <small>

                NETWORK RATING

              </small>



              <strong>

                {averageRating}

              </strong>

            </div>



          </div>



        </section>





        {/* ========================================= */}

        {/* SEARCH + FILTERS */}

        {/* ========================================= */}



        <section className="station-controls">



          <div className="station-search">



            <span>

              🔎

            </span>



            <input

              type="text"

              placeholder="Search station or location..."

              value={search}

              onChange={(event) =>

                setSearch(

                  event.target.value

                )

              }

            />



          </div>





          <select

            value={statusFilter}

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





          <select

            value={connectorFilter}

            onChange={(event) =>

              setConnectorFilter(

                event.target.value

              )

            }

          >

            <option value="All">

              All Connectors

            </option>



            <option value="CCS2">

              CCS2

            </option>



            <option value="CHAdeMO">

              CHAdeMO

            </option>



            <option value="Type 2">

              Type 2

            </option>

          </select>





          <select

            value={speedFilter}

            onChange={(event) =>

              setSpeedFilter(

                event.target.value

              )

            }

          >

            <option value="All">

              All Speeds

            </option>



            <option value="Fast">

              Fast · 60+ kW

            </option>



            <option value="Medium">

              Medium · 30–59 kW

            </option>



            <option value="Slow">

              Slow · under 30 kW

            </option>

          </select>





          <button

            className="reset-filter-button"

            onClick={resetFilters}

          >

            Reset

          </button>



        </section>





        {/* ========================================= */}

        {/* CONTENT */}

        {/* ========================================= */}



        <section className="stations-workspace">





          {/* ======================================= */}

          {/* MAP */}

          {/* ======================================= */}



          <div className="station-map-card">



            <div className="map-card-header">



              <div>

                <span>

                  LIVE MAP

                </span>



                <h2>

                  Charging Network

                </h2>

              </div>



              <div className="map-status">

                <span></span>

                Live

              </div>



            </div>





            <div className="station-map">



              <MapContainer

                center={[

                  location.latitude,

                  location.longitude,

                ]}

                zoom={12}

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





                <MapController

                  location={location}

                />





                {filteredStations.map(

                  (station) => (

                    <Marker

                      key={station.id}

                      position={[

                        station.latitude,

                        station.longitude,

                      ]}

                      eventHandlers={{

                        click: () =>

                          setSelectedStation(

                            station

                          ),

                      }}

                    >



                      <Popup>



                        <div className="map-popup">



                          <strong>

                            {station.name}

                          </strong>



                          <span>

                            {station.power} kW

                          </span>



                          <span>

                            {station.connector}

                          </span>



                          <span>

                            ⭐{" "}

                            {station.rating ||

                              "N/A"}

                          </span>



                        </div>



                      </Popup>



                    </Marker>

                  )

                )}



              </MapContainer>





              <div className="map-overlay">



                <span className="map-overlay-dot"></span>



                {filteredStations.length} stations shown



              </div>



            </div>



          </div>





          {/* ======================================= */}

          {/* STATION LIST */}

          {/* ======================================= */}



          <div className="station-list-panel">



            <div className="station-list-header">



              <div>

                <span>

                  STATIONS

                </span>



                <h2>

                  {filteredStations.length} Results

                </h2>

              </div>



              <span className="sort-label">

                Smart ranked

              </span>



            </div>





            <div className="station-list">



              {loading ? (



                <div className="station-loading">



                  <div className="loading-circle"></div>



                  <strong>

                    Loading stations...

                  </strong>



                  <span>

                    Connecting to EV SmartCharge

                  </span>



                </div>



              ) : filteredStations.length === 0 ? (



                <div className="station-empty">



                  <div>

                    🔎

                  </div>



                  <h3>

                    No stations found

                  </h3>



                  <p>

                    Try changing your search

                    or filters.

                  </p>



                  <button

                    onClick={resetFilters}

                  >

                    Clear Filters

                  </button>



                </div>



              ) : (



                filteredStations.map(

                  (station) => {



                    const isRecommended =

                      recommendedStation &&

                      recommendedStation.id ===

                        station.id;



                    return (



                      <article

                        key={station.id}

                        className={

                          selectedStation?.id ===

                          station.id

                            ? "station-list-card selected"

                            : "station-list-card"

                        }

                        onClick={() =>

                          setSelectedStation(

                            station

                          )

                        }

                      >



                        <div className="station-card-top">



                          <div className="station-card-logo">

                            ⚡

                          </div>





                          <div className="station-card-title">



                            {isRecommended && (

                              <span className="best-station-label">

                                ★ BEST MATCH

                              </span>

                            )}



                            <h3>

                              {station.name}

                            </h3>



                            <p>

                              {station.address}

                            </p>



                          </div>





                          <button

                            className={

                              isFavorite(station)

                                ? "favorite-button active"

                                : "favorite-button"

                            }

                            onClick={(event) => {

                              event.stopPropagation();



                              toggleFavorite(

                                station

                              );

                            }}

                            title="Save station"

                          >

                            {isFavorite(

                              station

                            )

                              ? "♥"

                              : "♡"}

                          </button>



                        </div>





                        <div className="station-status-row">



                          <span

                            className={`station-status ${String(

                              station.status

                            ).toLowerCase()}`}

                          >

                            <i></i>



                            {station.status}

                          </span>



                          {station.waitTime >

                            0 && (

                            <span className="wait-time">

                              ⏱{" "}

                              {station.waitTime} min

                              wait

                            </span>

                          )}



                        </div>





                        <div className="station-card-metrics">



                          <div>

                            <span>

                              POWER

                            </span>



                            <strong>

                              {station.power} kW

                            </strong>

                          </div>



                          <div>

                            <span>

                              PRICE

                            </span>



                            <strong>

                              ₹

                              {station.price ||

                                "--"}

                              /kWh

                            </strong>

                          </div>



                          <div>

                            <span>

                              RATING

                            </span>



                            <strong>

                              ⭐{" "}

                              {station.rating ||

                                "N/A"}

                            </strong>

                          </div>



                        </div>





                        <div className="station-card-bottom">



                          <span>

                            🔌{" "}

                            {station.connector}

                          </span>



                          <span>

                            {station.available}

                            {station.total

                              ? `/${station.total}`

                              : ""}{" "}

                            chargers

                          </span>



                          {station.score >

                            0 && (

                            <span className="station-score">

                              {Math.round(

                                station.score

                              )} score

                            </span>

                          )}



                        </div>



                      </article>



                    );

                  }

                )



              )}



            </div>



          </div>



        </section>





        {/* ========================================= */}

        {/* SELECTED STATION */}

        {/* ========================================= */}



        {selectedStation && (



          <section className="selected-station-panel">



            <div className="selected-station-heading">



              <div>

                <span>

                  SELECTED STATION

                </span>



                <h2>

                  {selectedStation.name}

                </h2>

              </div>



              <button

                onClick={() =>

                  setSelectedStation(

                    null

                  )

                }

              >

                ×

              </button>



            </div>





            <div className="selected-station-content">



              <div className="selected-station-overview">



                <div className="big-station-icon">

                  ⚡

                </div>



                <div>

                  <strong>

                    {selectedStation.name}

                  </strong>



                  <p>

                    {selectedStation.address}

                  </p>



                  <span className="selected-status">

                    ●{" "}

                    {selectedStation.status}

                  </span>

                </div>



              </div>





              <div className="selected-metrics">



                <div>

                  <span>

                    CHARGING POWER

                  </span>



                  <strong>

                    {selectedStation.power} kW

                  </strong>

                </div>



                <div>

                  <span>

                    PRICE

                  </span>



                  <strong>

                    ₹

                    {selectedStation.price ||

                      "--"}

                    /kWh

                  </strong>

                </div>



                <div>

                  <span>

                    RATING

                  </span>



                  <strong>

                    ⭐{" "}

                    {selectedStation.rating ||

                      "N/A"}

                  </strong>

                </div>



                <div>

                  <span>

                    CONNECTOR

                  </span>



                  <strong>

                    {selectedStation.connector}

                  </strong>

                </div>



              </div>





              <div className="selected-actions">



                <button

                  className="selected-primary"

                  onClick={() =>

                    toggleFavorite(

                      selectedStation

                    )

                  }

                >

                  {isFavorite(

                    selectedStation

                  )

                    ? "♥ Saved"

                    : "♡ Save Station"}

                </button>





                <button
                  type="button"
                  className="selected-secondary station-navigation-button"
                  onClick={() => navigateToStation(selectedStation)}
                  style={{ cursor: "pointer" }}
                >
                  ↗ Navigate with Google Maps
                </button>

                <NavLink

                  to="/trips"

                  className="selected-secondary"

                >

                  Plan Trip →

                </NavLink>



              </div>



            </div>



          </section>



        )}





        {/* ========================================= */}

        {/* FOOTER */}

        {/* ========================================= */}



        <footer className="stations-footer">



          <strong>

            ⚡ EV SmartCharge

          </strong>



          <span>

            Smart station discovery •

            Safe charging • Efficient journeys

          </span>



        </footer>



      </main>



    </div>

  );

}



export default Stations;