const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");
