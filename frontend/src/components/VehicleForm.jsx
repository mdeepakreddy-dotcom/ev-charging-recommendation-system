import React from "react";

function VehicleForm({
  vehicles,
  selectedVehicle,
  setSelectedVehicle,
  battery,
  setBattery,
}) {
  const handleVehicleChange = (event) => {
    const vehicleId = event.target.value;

    const vehicle = vehicles.find(
      (item) => String(item.id) === String(vehicleId)
    );

    setSelectedVehicle(vehicle);
  };

  return (
    <div className="vehicle-form">
      <h2>🚗 Vehicle Details</h2>

      <div className="form-group">
        <label htmlFor="vehicle">
          Select Vehicle
        </label>

        <select
          id="vehicle"
          value={selectedVehicle ? selectedVehicle.id : ""}
          onChange={handleVehicleChange}
        >
          <option value="">
            Select your vehicle
          </option>

          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
      </div>

      {selectedVehicle && (
        <div className="vehicle-details">
          <div>
            <strong>Battery Capacity:</strong>
            <span>{selectedVehicle.batteryCapacity} kWh</span>
          </div>

          <div>
            <strong>Maximum Range:</strong>
            <span>{selectedVehicle.maxRange} km</span>
          </div>

          <div>
            <strong>Connector:</strong>
            <span>{selectedVehicle.connectorType}</span>
          </div>

          <div>
            <strong>Max Charging Speed:</strong>
            <span>{selectedVehicle.maxChargingSpeed} kW</span>
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="battery">
          Current Battery: {battery}%
        </label>

        <input
          id="battery"
          type="range"
          min="0"
          max="100"
          value={battery}
          onChange={(event) =>
            setBattery(Number(event.target.value))
          }
        />

        <div className="battery-range">
          <span>0%</span>
          <span>{battery}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

export default VehicleForm;