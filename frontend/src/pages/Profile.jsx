import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "./Profile.css";


const VEHICLE_STORAGE_KEY =
  "evSmartChargeVehicleSettings";


function getVehicleName(vehicle) {
  return (
    vehicle?.name ||
    vehicle?.model ||
    vehicle?.vehicleName ||
    "EV Vehicle"
  );
}


function getBatteryCapacity(vehicle) {
  return Number(
    vehicle?.batteryCapacity ||
    vehicle?.battery_capacity ||
    vehicle?.capacity ||
    0
  );
}


function getVehicleRange(vehicle) {
  return Number(
    vehicle?.range ||
    vehicle?.rangeKm ||
    vehicle?.range_km ||
    0
  );
}


function getConnector(vehicle) {
  return (
    vehicle?.connector ||
    vehicle?.connectorType ||
    vehicle?.connector_type ||
    "CCS2"
  );
}


function getChargingSpeed(vehicle) {
  return Number(
    vehicle?.maxChargingSpeed ||
    vehicle?.maxChargingPower ||
    vehicle?.chargingSpeed ||
    vehicle?.maxPower ||
    0
  );
}


function getVehicleId(vehicle) {
  return (
    vehicle?.id ||
    vehicle?.vehicleId ||
    vehicle?.vehicle_id ||
    getVehicleName(vehicle)
  );
}


function Profile() {

  const {
    user,
    logout,
  } = useAuth();


  const [vehicles, setVehicles] = useState([]);

  const [selectedVehicleId, setSelectedVehicleId] =
    useState("");

  const [battery, setBattery] =
    useState(72);

  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  /*
   * Load vehicle catalog
   */
  useEffect(() => {

    const loadVehicles = async () => {

      try {

        setLoadingVehicles(true);

        const response = await fetch(
          "http://localhost:3000/api/vehicles"
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load vehicles."
          );
        }

        const data = await response.json();

        const vehicleList =
          Array.isArray(data)
            ? data
            : Array.isArray(data.vehicles)
              ? data.vehicles
              : [];

        setVehicles(vehicleList);


        /*
         * Load previously saved vehicle
         */
        const saved =
          localStorage.getItem(
            VEHICLE_STORAGE_KEY
          );


        if (saved) {

          try {

            const savedSettings =
              JSON.parse(saved);

            if (
              savedSettings.vehicleId !==
              undefined
            ) {
              setSelectedVehicleId(
                String(
                  savedSettings.vehicleId
                )
              );
            }

            if (
              savedSettings.battery !==
              undefined
            ) {
              setBattery(
                Number(
                  savedSettings.battery
                )
              );
            }

          } catch (storageError) {

            console.warn(
              "Unable to read saved vehicle settings."
            );

          }

        }

      } catch (requestError) {

        setError(
          requestError.message ||
          "Unable to load vehicle data."
        );

      } finally {

        setLoadingVehicles(false);

      }

    };


    loadVehicles();

  }, []);


  /*
   * Automatically select first vehicle
   * if no vehicle has been saved.
   */
  useEffect(() => {

    if (
      !selectedVehicleId &&
      vehicles.length > 0
    ) {

      setSelectedVehicleId(
        String(
          getVehicleId(vehicles[0])
        )
      );

    }

  }, [
    vehicles,
    selectedVehicleId,
  ]);


  /*
   * Find selected vehicle
   */
  const selectedVehicle = useMemo(() => {

    return vehicles.find(
      (vehicle) =>
        String(
          getVehicleId(vehicle)
        ) ===
        String(selectedVehicleId)
    );

  }, [
    vehicles,
    selectedVehicleId,
  ]);


  /*
   * Calculate estimated remaining range
   */
  const estimatedRange = useMemo(() => {

    if (!selectedVehicle) {
      return 0;
    }

    const maximumRange =
      getVehicleRange(
        selectedVehicle
      );

    return Math.round(
      maximumRange *
      (Number(battery) / 100)
    );

  }, [
    selectedVehicle,
    battery,
  ]);


  /*
   * Save vehicle settings
   */
  const handleSaveVehicle = () => {

    if (!selectedVehicle) {

      setError(
        "Please select a vehicle."
      );

      return;

    }


    setSaving(true);
    setMessage("");
    setError("");


    const settings = {

      vehicleId:
        getVehicleId(
          selectedVehicle
        ),

      vehicleName:
        getVehicleName(
          selectedVehicle
        ),

      battery:
        Number(battery),

      estimatedRange,

      savedAt:
        new Date().toISOString(),

    };


    try {

      localStorage.setItem(
        VEHICLE_STORAGE_KEY,
        JSON.stringify(settings)
      );


      setMessage(
        "Vehicle settings saved successfully."
      );

    } catch (storageError) {

      setError(
        "Unable to save vehicle settings."
      );

    } finally {

      setSaving(false);

    }

  };


  /*
   * Logout
   */
  const handleLogout = () => {

    logout();

  };


  /*
   * User initials
   */
  const userInitials = (
    user?.name ||
    "User"
  )
    .split(" ")
    .map(
      (part) =>
        part.charAt(0).toUpperCase()
    )
    .slice(0, 2)
    .join("");


  return (

    <div className="profile-page">

      {/* PAGE HEADER */}

      <section className="profile-header">

        <div>

          <div className="profile-breadcrumb">
            EV SmartCharge / Profile
          </div>

          <h1>
            Profile & Vehicle
          </h1>

          <p>
            Manage your account and EV preferences
            for smarter charging recommendations.
          </p>

        </div>

        <button
          className="profile-logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </section>


      {/* MAIN GRID */}

      <section className="profile-grid">


        {/* ACCOUNT CARD */}

        <div className="profile-card account-card">

          <div className="profile-card-heading">

            <div className="profile-heading-icon">
              👤
            </div>

            <div>

              <h2>
                Account Information
              </h2>

              <p>
                Your EV SmartCharge account
              </p>

            </div>

          </div>


          <div className="profile-user">

            <div className="profile-avatar">
              {userInitials}
            </div>

            <div>

              <h3>
                {user?.name || "EV User"}
              </h3>

              <p>
                {user?.email || "No email available"}
              </p>

            </div>

          </div>


          <div className="account-details">

            <div className="account-detail">

              <span>
                Name
              </span>

              <strong>
                {user?.name || "Not available"}
              </strong>

            </div>


            <div className="account-detail">

              <span>
                Email
              </span>

              <strong>
                {user?.email || "Not available"}
              </strong>

            </div>


            <div className="account-detail">

              <span>
                Account
              </span>

              <strong className="account-status">
                ● Active
              </strong>

            </div>

          </div>

        </div>


        {/* VEHICLE CARD */}

        <div className="profile-card vehicle-card">

          <div className="profile-card-heading">

            <div className="profile-heading-icon vehicle-icon">
              🚗
            </div>

            <div>

              <h2>
                My Electric Vehicle
              </h2>

              <p>
                Select the vehicle used for
                recommendations.
              </p>

            </div>

          </div>


          {loadingVehicles ? (

            <div className="profile-loading">

              <div className="profile-spinner"></div>

              <span>
                Loading vehicle catalog...
              </span>

            </div>

          ) : (

            <>

              <div className="vehicle-form-group">

                <label>
                  Select Vehicle
                </label>

                <select
                  value={selectedVehicleId}
                  onChange={(event) => {
                    setSelectedVehicleId(
                      event.target.value
                    );

                    setMessage("");
                    setError("");
                  }}
                >

                  {vehicles.length === 0 ? (

                    <option value="">
                      No vehicles available
                    </option>

                  ) : (

                    vehicles.map(
                      (vehicle) => (

                        <option
                          key={
                            getVehicleId(vehicle)
                          }
                          value={
                            getVehicleId(vehicle)
                          }
                        >
                          {getVehicleName(vehicle)}
                        </option>

                      )
                    )

                  )}

                </select>

              </div>


              {/* BATTERY */}

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
                  onChange={(event) => {

                    setBattery(
                      Number(
                        event.target.value
                      )
                    );

                    setMessage("");
                    setError("");

                  }}
                  className="battery-slider"
                />


                <div className="battery-scale">

                  <span>
                    0%
                  </span>

                  <span>
                    50%
                  </span>

                  <span>
                    100%
                  </span>

                </div>

              </div>


              {/* VEHICLE SPECS */}

              {selectedVehicle && (

                <div className="vehicle-specs">

                  <div className="vehicle-spec">

                    <span className="vehicle-spec-icon">
                      🔋
                    </span>

                    <div>

                      <span>
                        Battery
                      </span>

                      <strong>
                        {getBatteryCapacity(
                          selectedVehicle
                        ) || "--"}{" "}
                        kWh
                      </strong>

                    </div>

                  </div>


                  <div className="vehicle-spec">

                    <span className="vehicle-spec-icon">
                      📏
                    </span>

                    <div>

                      <span>
                        Full Range
                      </span>

                      <strong>
                        {getVehicleRange(
                          selectedVehicle
                        ) || "--"}{" "}
                        km
                      </strong>

                    </div>

                  </div>


                  <div className="vehicle-spec">

                    <span className="vehicle-spec-icon">
                      ⚡
                    </span>

                    <div>

                      <span>
                        Max Charging
                      </span>

                      <strong>
                        {getChargingSpeed(
                          selectedVehicle
                        ) || "--"}{" "}
                        kW
                      </strong>

                    </div>

                  </div>


                  <div className="vehicle-spec">

                    <span className="vehicle-spec-icon">
                      🔌
                    </span>

                    <div>

                      <span>
                        Connector
                      </span>

                      <strong>
                        {getConnector(
                          selectedVehicle
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

              )}


              {/* RANGE */}

              <div className="range-preview">

                <div>

                  <span>
                    Estimated remaining range
                  </span>

                  <strong>
                    {estimatedRange} km
                  </strong>

                </div>

                <div className="range-bar">

                  <div
                    className="range-bar-fill"
                    style={{
                      width: `${battery}%`,
                    }}
                  ></div>

                </div>

                <p>
                  Based on your current battery
                  level and the selected vehicle's
                  rated range.
                </p>

              </div>


              {/* SAVE */}

              <button
                className="save-vehicle-button"
                onClick={
                  handleSaveVehicle
                }
                disabled={
                  saving ||
                  !selectedVehicle
                }
              >

                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Vehicle Settings
                  </>
                )}

              </button>


              {message && (

                <div className="profile-success">
                  ✓ {message}
                </div>

              )}


              {error && (

                <div className="profile-error">
                  ⚠ {error}
                </div>

              )}

            </>

          )}

        </div>

      </section>


      {/* SAVED VEHICLE SUMMARY */}

      {selectedVehicle && (

        <section className="saved-vehicle-section">

          <div className="section-title">

            <div>

              <span>
                CURRENT VEHICLE
              </span>

              <h2>
                {getVehicleName(
                  selectedVehicle
                )}
              </h2>

            </div>

            <div className="vehicle-status-badge">
              ● Ready
            </div>

          </div>


          <div className="saved-vehicle-content">

            <div className="saved-vehicle-main">

              <div className="large-vehicle-icon">
                🚙
              </div>

              <div>

                <h3>
                  {getVehicleName(
                    selectedVehicle
                  )}
                </h3>

                <p>
                  {getConnector(
                    selectedVehicle
                  )} compatible electric vehicle
                </p>

              </div>

            </div>


            <div className="saved-stat">

              <span>
                Battery
              </span>

              <strong>
                {battery}%
              </strong>

            </div>


            <div className="saved-stat">

              <span>
                Remaining Range
              </span>

              <strong>
                {estimatedRange} km
              </strong>

            </div>


            <div className="saved-stat">

              <span>
                Charging Speed
              </span>

              <strong>
                {getChargingSpeed(
                  selectedVehicle
                )} kW
              </strong>

            </div>

          </div>

        </section>

      )}


      {/* QUICK LINKS */}

      <section className="profile-quick-section">

        <div className="section-title">

          <div>

            <span>
              QUICK ACCESS
            </span>

            <h2>
              Continue with EV SmartCharge
            </h2>

          </div>

        </div>


        <div className="quick-links-grid">


          <Link
            to="/stations"
            className="quick-link-card"
          >

            <div className="quick-link-icon">
              ⚡
            </div>

            <div>

              <h3>
                Find Charging Stations
              </h3>

              <p>
                Discover and compare nearby
                charging stations.
              </p>

            </div>

            <span className="quick-arrow">
              →
            </span>

          </Link>


          <Link
            to="/trips"
            className="quick-link-card"
          >

            <div className="quick-link-icon">
              🗺️
            </div>

            <div>

              <h3>
                Plan a Long Trip
              </h3>

              <p>
                Find charging stops along
                your journey.
              </p>

            </div>

            <span className="quick-arrow">
              →
            </span>

          </Link>


          <Link
            to="/favorites"
            className="quick-link-card"
          >

            <div className="quick-link-icon">
              ⭐
            </div>

            <div>

              <h3>
                Favorite Stations
              </h3>

              <p>
                Access your saved charging
                stations.
              </p>

            </div>

            <span className="quick-arrow">
              →
            </span>

          </Link>


          <Link
            to="/analytics"
            className="quick-link-card"
          >

            <div className="quick-link-icon">
              📊
            </div>

            <div>

              <h3>
                Station Analytics
              </h3>

              <p>
                Explore charging network
                insights.
              </p>

            </div>

            <span className="quick-arrow">
              →
            </span>

          </Link>


        </div>

      </section>


      {/* SAFETY INFORMATION */}

      <section className="profile-safety">

        <div className="profile-safety-icon">
          🛡️
        </div>

        <div>

          <h3>
            Smart Safety Reserve
          </h3>

          <p>
            EV SmartCharge uses a safety reserve
            when checking whether your vehicle can
            reach a charging station. This helps
            reduce the risk of arriving with a very
            low battery.
          </p>

        </div>

      </section>


      <footer className="profile-footer">

        <span>
          EV SMARTCHARGE
        </span>

        <p>
          Intelligent EV Charging Station
          Recommendation & Trip Planning
        </p>

      </footer>

    </div>

  );

}


export default Profile;