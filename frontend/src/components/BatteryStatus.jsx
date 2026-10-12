import React from "react";

function BatteryStatus({ battery }) {
  const getBatteryClass = () => {
    if (battery <= 20) {
      return "battery-danger";
    }

    if (battery <= 40) {
      return "battery-warning";
    }

    return "battery-good";
  };

  const getBatteryMessage = () => {
    if (battery <= 20) {
      return "Critical battery level";
    }

    if (battery <= 40) {
      return "Battery level is getting low";
    }

    return "Battery level is healthy";
  };

  return (
    <div className={`battery-status ${getBatteryClass()}`}>
      <div className="battery-icon">
        🔋
      </div>

      <div className="battery-info">
        <h3>{battery}% Battery</h3>
        <p>{getBatteryMessage()}</p>
      </div>
    </div>
  );
}

export default BatteryStatus;