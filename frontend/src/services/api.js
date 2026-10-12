import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// VEHICLES
// =====================================================

export const getVehicles = async () => {
  const response = await api.get("/vehicles");

  return response.data;
};

export const getVehicle = async (id) => {
  const response = await api.get(`/vehicles/${id}`);

  return response.data;
};

// =====================================================
// STATIONS
// =====================================================

export const getStations = async () => {
  const response = await api.get("/stations");

  return response.data;
};

export const getNearbyStations = async ({
  latitude,
  longitude,
  battery,
  maxRange,
  connector,
}) => {
  const response = await api.get("/stations/nearby", {
    params: {
      latitude,
      longitude,
      battery,
      maxRange,
      connector,
    },
  });

  return response.data;
};

// =====================================================
// CHARGING CALCULATOR
// =====================================================

export const calculateCharging = async ({
  battery,
  targetBattery,
  batteryCapacity,
  chargingSpeed,
  pricePerKwh,
}) => {
  const response = await api.get(
    "/charging-calculator",
    {
      params: {
        battery,
        targetBattery,
        batteryCapacity,
        chargingSpeed,
        pricePerKwh,
      },
    }
  );

  return response.data;
};

// =====================================================
// LOCATION / GEOCODING
// =====================================================

export const searchLocation = async (
  query
) => {
  const response = await api.get("/geocode", {
    params: {
      query,
    },
  });

  return response.data;
};

// Keep this alias also available.
// This prevents errors if another component
// imports geocodeLocation instead of searchLocation.

export const geocodeLocation = async (
  query
) => {
  return searchLocation(query);
};

// =====================================================
// ROUTE
// =====================================================

export const getRoute = async ({
  startLat,
  startLon,
  endLat,
  endLon,
}) => {
  const response = await api.get("/route", {
    params: {
      startLat,
      startLon,
      endLat,
      endLon,
    },
  });

  return response.data;
};

// =====================================================
// LONG TRIP PLANNER
// =====================================================

export const planTrip = async ({
  startLat,
  startLon,
  endLat,
  endLon,
  battery,
  maxRange,
  connector,
  batteryCapacity,
  maxChargingSpeed,
}) => {
  const response = await api.get("/trip-plan", {
    params: {
      startLat,
      startLon,
      endLat,
      endLon,
      battery,
      maxRange,
      connector,
      batteryCapacity,
      maxChargingSpeed,
    },
  });

  return response.data;
};

// =====================================================
// DEFAULT API INSTANCE
// =====================================================

export default api;