package com.evsmartcharge.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Controller
@RequestMapping("/api")
public class ApiController {
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private List<Map<String, Object>> stations;
    private List<Map<String, Object>> vehicles;

    public ApiController(ObjectMapper objectMapper, RestClient.Builder restClientBuilder) {
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder.build();
    }

    @PostConstruct
    void loadData() {
        try {
            stations = readData("data/stations.json");
            vehicles = readData("data/vehicles.json");
        } catch (Exception exception) {
            throw new IllegalStateException("Could not load EV station and vehicle reference data.", exception);
        }
    }

    @GetMapping("/")
    @ResponseBody
    public Map<String, Object> root() {
        return Map.of("success", true, "message", "EV SmartCharge API is running", "version", "1.0.0");
    }

    @GetMapping("/health")
    @ResponseBody
    public Map<String, Object> health() {
        return Map.of("success", true, "status", "healthy", "service", "EV SmartCharge Backend");
    }

    @GetMapping("/vehicles")
    @ResponseBody
    public List<Map<String, Object>> getVehicles() {
        return vehicles;
    }

    @GetMapping("/vehicles/{id}")
    @ResponseBody
    public Map<String, Object> getVehicle(@PathVariable String id) {
        return vehicles.stream()
                .filter(vehicle -> String.valueOf(vehicle.get("id")).equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found."));
    }

    @GetMapping("/stations")
    @ResponseBody
    public List<Map<String, Object>> getStations() {
        return stations;
    }

    @GetMapping("/stations/nearby")
    @ResponseBody
    public Map<String, Object> getNearbyStations(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam double battery,
            @RequestParam double maxRange,
            @RequestParam String connector) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid latitude and longitude are required.");
        }
        if (battery < 0 || battery > 100 || maxRange <= 0 || connector.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid battery, range and connector are required.");
        }
        double remainingRange = battery / 100 * maxRange;
        List<Map<String, Object>> analyzed = new ArrayList<>();
        for (Map<String, Object> station : stations) {
            double distance = distance(latitude, longitude,
                    number(station, "latitude"), number(station, "longitude"));
            List<?> connectors = (List<?>) station.getOrDefault("connectors", List.of());
            boolean compatible = connectors.stream()
                    .anyMatch(value -> String.valueOf(value).equalsIgnoreCase(connector));
            boolean reachable = distance <= remainingRange;
            boolean usable = compatible && reachable
                    && !Boolean.TRUE.equals(station.get("fault"))
                    && !Boolean.FALSE.equals(station.get("open"))
                    && number(station, "availableChargers") > 0;
            double score = usable ? recommendationScore(station, distance) : 0;
            Map<String, Object> item = new LinkedHashMap<>(station);
            item.put("distance", round(distance, 2));
            item.put("connectorCompatible", compatible);
            item.put("reachability", Map.of(
                    "status", !reachable ? "UNREACHABLE" : distance <= remainingRange * .85 ? "SAFE" : "LOW_RESERVE",
                    "message", !reachable ? "Vehicle may not be able to reach this station"
                            : "Vehicle can reach this station"));
            item.put("score", score);
            item.put("usable", usable);
            analyzed.add(item);
        }
        analyzed.sort(Comparator.comparingDouble(item -> -number(item, "score")));
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("vehicle", Map.of("battery", battery, "maxRange", maxRange,
                "remainingRange", round(remainingRange, 2), "connector", connector));
        response.put("recommendedStation", analyzed.stream()
                .filter(item -> Boolean.TRUE.equals(item.get("usable"))).findFirst().orElse(null));
        response.put("count", analyzed.size());
        response.put("validStationCount",
                analyzed.stream().filter(item -> Boolean.TRUE.equals(item.get("usable"))).count());
        response.put("allStations", analyzed);
        return response;
    }

    @GetMapping("/charging-calculator")
    @ResponseBody
    public Map<String, Object> chargingCalculator(
            @RequestParam double battery,
            @RequestParam double targetBattery,
            @RequestParam double batteryCapacity,
            @RequestParam double chargingSpeed,
            @RequestParam double pricePerKwh) {
        if (battery < 0 || battery > 100 || targetBattery > 100 || targetBattery <= battery
                || batteryCapacity <= 0 || chargingSpeed <= 0 || pricePerKwh < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Battery, target, capacity, speed or price is invalid.");
        }
        double energy = (targetBattery - battery) / 100 * batteryCapacity;
        double gridEnergy = energy / .9;
        return Map.of(
                "success", true,
                "currentBattery", battery,
                "targetBattery", targetBattery,
                "batteryCapacity", batteryCapacity,
                "energyRequired", round(energy, 2),
                "gridEnergy", round(gridEnergy, 2),
                "chargingTimeMinutes", round(gridEnergy / chargingSpeed * 60, 1),
                "estimatedCost", round(gridEnergy * pricePerKwh, 2),
                "chargingEfficiency", 90);
    }

    @GetMapping("/geocode")
    @ResponseBody
    public Map<String, Object> geocode(@RequestParam String query) {
        if (query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location search text is required.");
        }
        JsonNode photonResponse;
        try {
            photonResponse = restClient.get()
                    .uri(uri -> uri.scheme("https").host("photon.komoot.io")
                            .path("/api/").queryParam("limit", 5).queryParam("q", query).build())
                    .header("User-Agent", "EV-SmartCharge/1.0")
                    .retrieve().body(JsonNode.class);
        } catch (RestClientException photonException) {
            return Map.of("success", true, "results", nominatimFallback(query, photonException));
        }
        List<Map<String, Object>> results = photonResults(photonResponse);
        if (results.isEmpty()) {
            results = nominatimFallback(query, null);
        }
        return Map.of("success", true, "results", results);
    }

    private List<Map<String, Object>> nominatimFallback(String query, RestClientException photonException) {
        try {
            return nominatimResults(query);
        } catch (RestClientException nominatimException) {
            if (photonException != null) {
                photonException.addSuppressed(nominatimException);
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Location search services are unavailable.",
                    photonException == null ? nominatimException : photonException);
        }
    }

    private JsonNode searchNominatim(String query) {
        return restClient.get()
                .uri(uri -> uri.scheme("https").host("nominatim.openstreetmap.org")
                        .path("/search").queryParam("format", "json").queryParam("limit", 5)
                        .queryParam("addressdetails", 1).queryParam("q", query).build())
                .header("User-Agent", "EV-SmartCharge/1.0")
                .retrieve().body(JsonNode.class);
    }

    private List<Map<String, Object>> nominatimResults(String query) {
        JsonNode response = searchNominatim(query);
        List<Map<String, Object>> results = new ArrayList<>();
        if (response != null && response.isArray()) {
            for (JsonNode item : response) {
                String displayName = item.path("display_name").asText();
                String name = item.path("name").asText("");
                if (name.isBlank()) name = displayName.split(",")[0];
                results.add(Map.of("latitude", item.path("lat").asDouble(),
                        "longitude", item.path("lon").asDouble(), "name", name,
                        "displayName", displayName));
            }
        }
        return results;
    }

    private List<Map<String, Object>> photonResults(JsonNode response) {
        List<Map<String, Object>> results = new ArrayList<>();
        JsonNode features = response == null ? null : response.path("features");
        if (features != null && features.isArray()) {
            for (JsonNode feature : features) {
                JsonNode coordinates = feature.path("geometry").path("coordinates");
                if (!coordinates.isArray() || coordinates.size() < 2
                        || !coordinates.get(0).isNumber() || !coordinates.get(1).isNumber()) {
                    continue;
                }
                JsonNode properties = feature.path("properties");
                String name = properties.path("name").asText("");
                if (name.isBlank()) {
                    name = properties.path("city").asText("");
                }
                if (name.isBlank()) {
                    name = properties.path("county").asText("");
                }
                if (name.isBlank()) {
                    continue;
                }
                List<String> displayParts = new ArrayList<>();
                displayParts.add(name);
                for (String part : List.of(
                        properties.path("state").asText(""),
                        properties.path("country").asText(""))) {
                    if (!part.isBlank() && !displayParts.contains(part)) {
                        displayParts.add(part);
                    }
                }
                results.add(Map.of(
                        "latitude", coordinates.get(1).asDouble(),
                        "longitude", coordinates.get(0).asDouble(),
                        "name", name,
                        "displayName", String.join(", ", displayParts)));
            }
        }
        return results;
    }

    @GetMapping("/route")
    @ResponseBody
    public JsonNode route(
            @RequestParam double startLat,
            @RequestParam double startLon,
            @RequestParam double endLat,
            @RequestParam double endLon) {
        return getRoute(startLat, startLon, endLat, endLon);
    }

    @GetMapping("/trip-plan")
    @ResponseBody
    public Map<String, Object> planTrip(
            @RequestParam double startLat,
            @RequestParam double startLon,
            @RequestParam double endLat,
            @RequestParam double endLon,
            @RequestParam double battery,
            @RequestParam double maxRange,
            @RequestParam String connector,
            @RequestParam double batteryCapacity,
            @RequestParam double maxChargingSpeed) {
        if (battery < 0 || battery > 100 || maxRange <= 0 || batteryCapacity <= 0 || maxChargingSpeed <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid vehicle and battery information is required.");
        }
        JsonNode route = getRoute(startLat, startLon, endLat, endLon);
        JsonNode routeData = route.path("routes").path(0);
        if (routeData.isMissingNode()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Routing service returned no route.");
        }
        double distanceKm = routeData.path("distance").asDouble() / 1000;
        double durationMinutes = routeData.path("duration").asDouble() / 60;
        double usableRange = maxRange * battery / 100 * .85;
        List<Map<String, Object>> stops = findChargingStops(startLat, startLon, endLat, endLon,
                usableRange, maxRange, batteryCapacity, maxChargingSpeed, connector, distanceKm);
        double chargingMinutes = stops.stream().mapToDouble(stop -> number(stop, "chargingTimeMinutes")).sum();
        double cost = stops.stream().mapToDouble(stop -> number(stop, "estimatedCost")).sum();
        double arrivalBattery = Math.max(0, battery - distanceKm / maxRange * 100);
        boolean complete = distanceKm <= usableRange || stops.size() > 0;
        Map<String, Object> summary = Map.of(
                "routeComplete", complete,
                "numberOfStops", stops.size(),
                "totalChargingCost", round(cost, 2),
                "totalChargingTimeMinutes", round(chargingMinutes, 1),
                "estimatedArrivalBattery", round(arrivalBattery, 1),
                "message", complete ? "Route checked against the selected vehicle and available charging stations."
                        : "No compatible charging stops were found along this route. Review the route before departure.");
        Map<String, Object> safety = Map.of(
                "initialRangeKm", round(maxRange * battery / 100, 1),
                "safetyReserveKm", round(maxRange * battery / 100 * .15, 1),
                "usableRangeKm", round(usableRange, 1));
        return Map.of(
                "route", Map.of("distanceKm", round(distanceKm, 1), "durationMinutes", round(durationMinutes, 1),
                        "geometry", routeData.path("geometry")),
                "summary", summary,
                "safety", safety,
                "chargingStops", stops);
    }

    private JsonNode getRoute(double startLat, double startLon, double endLat, double endLon) {
        try {
            JsonNode response = restClient.get()
                    .uri("https://router.project-osrm.org/route/v1/driving/{startLon},{startLat};{endLon},{endLat}?overview=full&geometries=geojson",
                            startLon, startLat, endLon, endLat)
                    .retrieve().body(JsonNode.class);
            if (response == null || !response.path("routes").isArray()
                    || response.path("routes").isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Routing service returned no route.");
            }
            return response;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Routing service is unavailable.", exception);
        }
    }

    private List<Map<String, Object>> findChargingStops(
            double startLat, double startLon, double endLat, double endLon, double usableRange,
            double maxRange, double capacity, double chargingSpeed, String connector, double distanceKm) {
        List<Map<String, Object>> candidates = new ArrayList<>();
        if (distanceKm <= usableRange) return candidates;
        stations.stream()
                .filter(station -> station.get("connectors") instanceof List<?> connectors
                        && connectors.stream().anyMatch(value -> String.valueOf(value).equalsIgnoreCase(connector)))
                .filter(station -> number(station, "availableChargers") > 0
                        && !Boolean.TRUE.equals(station.get("fault")))
                .forEach(station -> {
                    double progress = projection(startLat, startLon, endLat, endLon,
                            number(station, "latitude"), number(station, "longitude"));
                    double distanceToRoute = pointToRouteKm(startLat, startLon, endLat, endLon,
                            number(station, "latitude"), number(station, "longitude"), progress);
                    if (progress > 0 && progress < 1 && distanceToRoute < 25) {
                        Map<String, Object> item = new LinkedHashMap<>(station);
                        item.put("progress", progress);
                        candidates.add(item);
                    }
                });
        candidates.sort(Comparator.comparingDouble(item -> number(item, "progress")));
        List<Map<String, Object>> stops = new ArrayList<>();
        double previousProgress = 0;
        for (Map<String, Object> candidate : candidates) {
            if (stops.size() >= 5) break;
            double progress = number(candidate, "progress");
            double legDistance = (progress - previousProgress) * distanceKm;
            if (legDistance > usableRange) continue;
            double targetBattery = Math.min(85, Math.max(60, legDistance / maxRange * 100 + 15));
            double energy = Math.max(0, (targetBattery - 15) / 100 * capacity);
            candidate.put("stationId", candidate.get("id"));
            candidate.put("latitude", candidate.get("latitude"));
            candidate.put("longitude", candidate.get("longitude"));
            candidate.put("chargingTimeMinutes", round(energy / chargingSpeed * 60, 1));
            candidate.put("estimatedCost", round(energy * number(candidate, "pricePerKwh"), 2));
            candidate.put("energyRequired", round(energy, 2));
            stops.add(candidate);
            previousProgress = progress;
        }
        return stops;
    }

    private double projection(double startLat, double startLon, double endLat, double endLon,
            double pointLat, double pointLon) {
        double dx = endLon - startLon;
        double dy = endLat - startLat;
        double denominator = dx * dx + dy * dy;
        if (denominator == 0) return 0;
        return Math.max(0, Math.min(1, ((pointLon - startLon) * dx + (pointLat - startLat) * dy) / denominator));
    }

    private double pointToRouteKm(double startLat, double startLon, double endLat, double endLon,
            double pointLat, double pointLon, double progress) {
        return distance(pointLat, pointLon, startLat + progress * (endLat - startLat),
                startLon + progress * (endLon - startLon));
    }

    private List<Map<String, Object>> readData(String path) throws Exception {
        return objectMapper.readValue(new ClassPathResource(path).getInputStream(),
                new TypeReference<>() {});
    }

    private double recommendationScore(Map<String, Object> station, double distance) {
        double distanceScore = Math.max(0, 100 - distance * 10);
        double availability = number(station, "totalChargers") == 0 ? 0
                : number(station, "availableChargers") / number(station, "totalChargers") * 100;
        double waiting = Math.max(0, 100 - number(station, "waitingTime") * 4);
        double speed = Math.min(100, number(station, "chargingSpeed") / 150 * 100);
        double price = Math.max(0, 100 - (number(station, "pricePerKwh") - 8) * 10);
        double rating = number(station, "rating") / 5 * 100;
        return round(distanceScore * .25 + availability * .20 + waiting * .15 + speed * .15 + price * .10
                + rating * .15, 2);
    }

    private double number(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value instanceof Number number ? number.doubleValue() : 0;
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round(double value, int places) {
        double factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }
}
