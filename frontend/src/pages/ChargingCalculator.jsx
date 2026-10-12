import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import "./ChargingCalculator.css";

const API_URL = "http://localhost:3000/api";

function ChargingCalculator() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [currentBattery, setCurrentBattery] = useState(40);
  const [targetBattery, setTargetBattery] = useState(80);

  const [chargingPower, setChargingPower] = useState(50);
  const [pricePerKwh, setPricePerKwh] = useState(12);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/vehicles`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load vehicle information."
        );
      }

      const data = await response.json();

      const list =
        Array.isArray(data)
          ? data
          : data?.vehicles || [];

      setVehicles(list);

      if (list.length > 0) {
        setSelectedVehicle(list[0]);

        const defaultPower =
          Number(
            list[0].maxChargingSpeed ||
              list[0].maxChargingPower ||
              50
          );

        setChargingPower(
          defaultPower
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load vehicles. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleVehicleChange(event) {
    const vehicle =
      vehicles.find(
        (item) =>
          String(
            item.id ||
              item._id
          ) === event.target.value
      );

    if (!vehicle) {
      return;
    }

    setSelectedVehicle(vehicle);

    const defaultPower =
      Number(
        vehicle.maxChargingSpeed ||
          vehicle.maxChargingPower ||
          50
      );

    setChargingPower(
      defaultPower
    );
  }

  const batteryCapacity = useMemo(() => {
    if (!selectedVehicle) {
      return 0;
    }

    return Number(
      selectedVehicle.batteryCapacity ||
        selectedVehicle.capacity ||
        0
    );
  }, [selectedVehicle]);

  const energyRequired = useMemo(() => {
    if (
      batteryCapacity <= 0 ||
      targetBattery <= currentBattery
    ) {
      return 0;
    }

    return (
      batteryCapacity *
      ((targetBattery - currentBattery) /
        100)
    );
  }, [
    batteryCapacity,
    currentBattery,
    targetBattery,
  ]);

  const chargingTimeHours = useMemo(() => {
    if (
      energyRequired <= 0 ||
      chargingPower <= 0
    ) {
      return 0;
    }

    return (
      energyRequired /
      chargingPower
    );
  }, [
    energyRequired,
    chargingPower,
  ]);

  const chargingTimeMinutes = useMemo(() => {
    return Math.round(
      chargingTimeHours * 60
    );
  }, [chargingTimeHours]);

  const chargingCost = useMemo(() => {
    return (
      energyRequired *
      Number(pricePerKwh || 0)
    );
  }, [
    energyRequired,
    pricePerKwh,
  ]);

  function formatChargingTime(minutes) {
    if (minutes <= 0) {
      return "0 min";
    }

    const hours =
      Math.floor(minutes / 60);

    const mins =
      minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    }

    if (mins === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${mins} min`;
  }

  function handleCurrentBatteryChange(
    event
  ) {
    const value = Number(
      event.target.value
    );

    setCurrentBattery(value);

    if (value >= targetBattery) {
      setTargetBattery(
        Math.min(
          100,
          value + 5
        )
      );
    }
  }

  function handleTargetBatteryChange(
    event
  ) {
    const value = Number(
      event.target.value
    );

    if (value <= currentBattery) {
      setTargetBattery(
        Math.min(
          100,
          currentBattery + 5
        )
      );

      return;
    }

    setTargetBattery(value);
  }

  return (
    <div className="charging-calculator-page">

      <Navbar />

      <main className="charging-calculator-main">

        {/* HEADER */}

        <section className="calculator-header">

          <div>

            <span className="calculator-eyebrow">
              SMART CHARGING TOOL
            </span>

            <h1>
              Charging Calculator
            </h1>

            <p>
              Estimate charging energy,
              charging time and cost for
              your EV.
            </p>

          </div>

          <div className="calculator-header-badge">

            <span>
              ⚡
            </span>

            <div>
              <strong>
                EV SmartCharge
              </strong>

              <small>
                Fast charging estimates
              </small>
            </div>

          </div>

        </section>


        {/* ERROR */}

        {error && (

          <div className="calculator-error">

            <strong>
              ⚠ Unable to load data
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}


        {/* CALCULATOR */}

        <section className="calculator-layout">

          {/* LEFT PANEL */}

          <div className="calculator-control-card">

            <div className="calculator-section-title">

              <span>
                01
              </span>

              <div>

                <h2>
                  Charging Details
                </h2>

                <p>
                  Enter your current
                  charging information.
                </p>

              </div>

            </div>


            {/* VEHICLE */}

            <div className="calculator-field">

              <label>
                VEHICLE
              </label>

              {loading ? (

                <div className="calculator-loading">
                  Loading vehicles...
                </div>

              ) : (

                <select
                  value={
                    selectedVehicle?.id ||
                    selectedVehicle?._id ||
                    ""
                  }
                  onChange={
                    handleVehicleChange
                  }
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
                        {vehicle.brand
                          ? `${vehicle.brand} ${vehicle.model}`
                          : vehicle.model}
                      </option>

                    )
                  )}

                </select>

              )}

            </div>


            {/* BATTERY CAPACITY */}

            <div className="calculator-info-row">

              <div>

                <span>
                  BATTERY CAPACITY
                </span>

                <strong>
                  {batteryCapacity || "--"} kWh
                </strong>

              </div>

              <div>

                <span>
                  CONNECTOR
                </span>

                <strong>
                  {selectedVehicle?.connectorType ||
                    selectedVehicle?.connector ||
                    "CCS2"}
                </strong>

              </div>

            </div>


            {/* CURRENT BATTERY */}

            <div className="calculator-field">

              <div className="calculator-label-row">

                <label>
                  CURRENT BATTERY
                </label>

                <strong>
                  {currentBattery}%
                </strong>

              </div>

              <input
                className="calculator-range"
                type="range"
                min="5"
                max="100"
                value={currentBattery}
                onChange={
                  handleCurrentBatteryChange
                }
              />

              <div className="calculator-range-labels">

                <span>
                  5%
                </span>

                <span>
                  100%
                </span>

              </div>

            </div>


            {/* TARGET BATTERY */}

            <div className="calculator-field">

              <div className="calculator-label-row">

                <label>
                  TARGET BATTERY
                </label>

                <strong>
                  {targetBattery}%
                </strong>

              </div>

              <input
                className="calculator-range"
                type="range"
                min="10"
                max="100"
                value={targetBattery}
                onChange={
                  handleTargetBatteryChange
                }
              />

              <div className="calculator-range-labels">

                <span>
                  10%
                </span>

                <span>
                  100%
                </span>

              </div>

            </div>


            {/* CHARGING POWER */}

            <div className="calculator-field">

              <div className="calculator-label-row">

                <label>
                  CHARGING POWER
                </label>

                <strong>
                  {chargingPower} kW
                </strong>

              </div>

              <input
                type="number"
                min="1"
                max="500"
                value={chargingPower}
                onChange={(event) =>
                  setChargingPower(
                    Number(
                      event.target.value
                    )
                  )
                }
              />

              <small className="calculator-help">
                Enter the charging station
                power in kW.
              </small>

            </div>


            {/* PRICE */}

            <div className="calculator-field">

              <div className="calculator-label-row">

                <label>
                  PRICE PER kWh
                </label>

                <strong>
                  ₹{pricePerKwh}
                </strong>

              </div>

              <input
                type="number"
                min="0"
                step="0.5"
                value={pricePerKwh}
                onChange={(event) =>
                  setPricePerKwh(
                    Number(
                      event.target.value
                    )
                  )
                }
              />

              <small className="calculator-help">
                Enter the charging station
                electricity price.
              </small>

            </div>

          </div>


          {/* RIGHT RESULTS */}

          <div className="calculator-results-card">

            <div className="calculator-results-heading">

              <span>
                CHARGING ESTIMATE
              </span>

              <h2>
                Your Charging Summary
              </h2>

              <p>
                Based on the selected vehicle
                and charging settings.
              </p>

            </div>


            {/* MAIN RESULT */}

            <div className="main-charging-result">

              <div className="charging-result-icon">
                ⚡
              </div>

              <div>

                <span>
                  ESTIMATED CHARGING TIME
                </span>

                <strong>
                  {formatChargingTime(
                    chargingTimeMinutes
                  )}
                </strong>

              </div>

            </div>


            {/* RESULT GRID */}

            <div className="calculator-result-grid">

              <div className="calculator-result-item">

                <span>
                  ENERGY REQUIRED
                </span>

                <strong>
                  {energyRequired.toFixed(2)} kWh
                </strong>

                <small>
                  Energy needed to reach
                  target battery
                </small>

              </div>


              <div className="calculator-result-item">

                <span>
                  ESTIMATED COST
                </span>

                <strong>
                  ₹{chargingCost.toFixed(2)}
                </strong>

                <small>
                  Based on current
                  price per kWh
                </small>

              </div>


              <div className="calculator-result-item">

                <span>
                  CURRENT BATTERY
                </span>

                <strong>
                  {currentBattery}%
                </strong>

                <small>
                  Starting charge level
                </small>

              </div>


              <div className="calculator-result-item">

                <span>
                  TARGET BATTERY
                </span>

                <strong>
                  {targetBattery}%
                </strong>

                <small>
                  Desired charge level
                </small>

              </div>

            </div>


            {/* BATTERY VISUAL */}

            <div className="battery-visual-section">

              <div className="battery-visual-header">

                <span>
                  BATTERY PROGRESS
                </span>

                <strong>
                  {currentBattery}% →{" "}
                  {targetBattery}%
                </strong>

              </div>

              <div className="battery-visual">

                <div
                  className="battery-current"
                  style={{
                    width: `${currentBattery}%`,
                  }}
                ></div>

                <div
                  className="battery-target"
                  style={{
                    left: `${targetBattery}%`,
                  }}
                ></div>

              </div>

              <div className="battery-visual-labels">

                <span>
                  {currentBattery}% Current
                </span>

                <span>
                  {targetBattery}% Target
                </span>

              </div>

            </div>


            {/* FORMULA */}

            <div className="calculator-formula">

              <span>
                CALCULATION
              </span>

              <p>
                Energy = Battery Capacity ×
                Battery Percentage Increase
              </p>

              <p>
                Time = Energy ÷ Charging Power
              </p>

              <p>
                Cost = Energy × Price per kWh
              </p>

            </div>

          </div>

        </section>


        {/* INFORMATION CARDS */}

        <section className="calculator-info-cards">

          <div className="calculator-info-card">

            <div>
              🔋
            </div>

            <section>

              <h3>
                Battery Energy
              </h3>

              <p>
                The calculator estimates how
                much energy is required to
                increase your battery from the
                current level to the target level.
              </p>

            </section>

          </div>


          <div className="calculator-info-card">

            <div>
              ⏱️
            </div>

            <section>

              <h3>
                Charging Time
              </h3>

              <p>
                Charging time is estimated
                using the required energy and
                the selected charging power.
              </p>

            </section>

          </div>


          <div className="calculator-info-card">

            <div>
              💰
            </div>

            <section>

              <h3>
                Charging Cost
              </h3>

              <p>
                Estimated cost is calculated
                using the energy required and
                the charging station price.
              </p>

            </section>

          </div>

        </section>


        <footer className="charging-calculator-footer">

          <strong>
            ⚡ EV SmartCharge
          </strong>

          <span>
            Smart charging estimates
            • Cost analysis • Energy planning
          </span>

        </footer>

      </main>

    </div>
  );
}

export default ChargingCalculator;