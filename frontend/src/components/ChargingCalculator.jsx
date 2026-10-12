import React, { useState } from "react";

import { calculateCharging } from "../services/api";

function ChargingCalculator({
  battery,
  selectedVehicle,
  recommendedStation,
}) {
  const [targetBattery, setTargetBattery] =
    useState(80);

  const [chargingSpeed, setChargingSpeed] =
    useState(
      recommendedStation?.chargingSpeed ||
        selectedVehicle?.maxChargingSpeed ||
        50
    );

  const [pricePerKwh, setPricePerKwh] =
    useState(
      recommendedStation?.pricePerKwh || 12
    );

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================
  // CALCULATE
  // =========================

  const handleCalculate = async () => {
    setError("");
    setResult(null);

    if (!selectedVehicle) {
      setError(
        "Please select a vehicle first."
      );
      return;
    }

    if (targetBattery <= battery) {
      setError(
        "Target battery must be greater than current battery."
      );
      return;
    }

    if (targetBattery > 100) {
      setError(
        "Target battery cannot exceed 100%."
      );
      return;
    }

    setLoading(true);

    try {
      const data =
        await calculateCharging({
          battery,
          targetBattery,
          batteryCapacity:
            selectedVehicle.batteryCapacity,
          chargingSpeed,
          pricePerKwh,
        });

      setResult(data);
    } catch (err) {
      console.error(
        "Charging calculation error:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to calculate charging details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="calculator-section">
      <div className="calculator-header">
        <div>
          <p className="section-label">
            CHARGING CALCULATOR
          </p>

          <h2>
            Estimate Charging Time & Cost
          </h2>

          <p className="calculator-description">
            Calculate how much time and money
            you need to charge your EV.
          </p>
        </div>

        <div className="calculator-icon">
          ⚡
        </div>
      </div>

      {/* =========================
          INPUTS
      ========================= */}

      <div className="calculator-grid">
        <div className="calculator-input-card">
          <label>
            Current Battery
          </label>

          <div className="calculator-value">
            {battery}%
          </div>

          <div className="calculator-progress">
            <div
              style={{
                width: `${battery}%`,
              }}
            />
          </div>
        </div>

        <div className="calculator-input-card">
          <label>
            Target Battery
          </label>

          <div className="calculator-value">
            {targetBattery}%
          </div>

          <input
            type="range"
            min={battery + 1}
            max="100"
            value={targetBattery}
            onChange={(event) =>
              setTargetBattery(
                Number(event.target.value)
              )
            }
          />

          <div className="calculator-range">
            <span>
              {battery}%
            </span>

            <span>100%</span>
          </div>
        </div>

        <div className="calculator-input-card">
          <label>
            Charging Speed
          </label>

          <div className="calculator-number-input">
            <input
              type="number"
              min="1"
              value={chargingSpeed}
              onChange={(event) =>
                setChargingSpeed(
                  Number(event.target.value)
                )
              }
            />

            <span>kW</span>
          </div>

          <small>
            {recommendedStation
              ? `Recommended station: ${recommendedStation.name}`
              : "Vehicle maximum charging speed"}
          </small>
        </div>

        <div className="calculator-input-card">
          <label>
            Electricity Price
          </label>

          <div className="calculator-number-input">
            <span>₹</span>

            <input
              type="number"
              min="0"
              step="0.5"
              value={pricePerKwh}
              onChange={(event) =>
                setPricePerKwh(
                  Number(event.target.value)
                )
              }
            />

            <span>/kWh</span>
          </div>

          <small>
            Charging station energy price
          </small>
        </div>
      </div>

      {/* =========================
          BUTTON
      ========================= */}

      <button
        type="button"
        className="calculator-button"
        onClick={handleCalculate}
        disabled={loading}
      >
        {loading
          ? "Calculating..."
          : "⚡ Calculate Charging"}
      </button>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="calculator-error">
          {error}
        </div>
      )}

      {/* =========================
          RESULT
      ========================= */}

      {result && (
        <div className="calculator-results">
          <div className="result-card">
            <span className="result-icon">
              ⏱️
            </span>

            <div>
              <small>
                Charging Time
              </small>

              <strong>
                {result.chargingTimeMinutes >=
                60
                  ? `${Math.floor(
                      result.chargingTimeMinutes /
                        60
                    )}h ${Math.round(
                      result.chargingTimeMinutes %
                        60
                    )}m`
                  : `${Math.round(
                      result.chargingTimeMinutes
                    )} min`}
              </strong>
            </div>
          </div>

          <div className="result-card">
            <span className="result-icon">
              💰
            </span>

            <div>
              <small>
                Estimated Cost
              </small>

              <strong>
                ₹
                {result.estimatedCost}
              </strong>
            </div>
          </div>

          <div className="result-card">
            <span className="result-icon">
              ⚡
            </span>

            <div>
              <small>
                Energy Required
              </small>

              <strong>
                {result.energyRequired}{" "}
                kWh
              </strong>
            </div>
          </div>

          <div className="result-card">
            <span className="result-icon">
              🔌
            </span>

            <div>
              <small>
                Grid Energy
              </small>

              <strong>
                {result.gridEnergy}{" "}
                kWh
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ChargingCalculator;