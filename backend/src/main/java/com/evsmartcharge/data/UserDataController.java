package com.evsmartcharge.data;

import com.evsmartcharge.user.User;
import com.evsmartcharge.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class UserDataController {
    private final FavoriteRepository favorites;
    private final ReviewRepository reviews;
    private final TripHistoryRepository trips;
    private final UserRepository users;
    private final ObjectMapper objectMapper;
    private final com.evsmartcharge.api.ApiController apiController;

    public UserDataController(
            FavoriteRepository favorites,
            ReviewRepository reviews,
            TripHistoryRepository trips,
            UserRepository users,
            ObjectMapper objectMapper,
            com.evsmartcharge.api.ApiController apiController) {
        this.favorites = favorites;
        this.reviews = reviews;
        this.trips = trips;
        this.users = users;
        this.objectMapper = objectMapper;
        this.apiController = apiController;
    }

    @GetMapping("/favorites")
    public Map<String, Object> listFavorites(Authentication authentication) {
        Long userId = userId(authentication);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Favorite favorite : favorites.findAllByUserIdOrderByCreatedAtDesc(userId)) {
            apiController.getStations().stream()
                    .filter(station -> String.valueOf(station.get("id")).equals(favorite.getStationId()))
                    .findFirst()
                    .ifPresent(station -> {
                        Map<String, Object> item = new LinkedHashMap<>(station);
                        item.put("favoriteId", favorite.getId());
                        item.put("stationId", favorite.getStationId());
                        item.put("favoritedAt", favorite.getCreatedAt());
                        result.add(item);
                    });
        }
        return Map.of("success", true, "favorites", result);
    }

    @PostMapping("/favorites")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addFavorite(
            Authentication authentication,
            @RequestBody FavoriteRequest request) {
        if (request.stationId() == null || request.stationId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station ID is required.");
        }
        String stationId = request.stationId().trim();
        Map<String, Object> station = findStation(stationId);
        Favorite favorite = favorites.findByUserIdAndStationId(userId(authentication), stationId)
                .orElseGet(() -> favorites.save(new Favorite(userId(authentication), stationId)));
        Map<String, Object> result = new LinkedHashMap<>(station);
        result.put("favoriteId", favorite.getId());
        result.put("stationId", stationId);
        result.put("favoritedAt", favorite.getCreatedAt());
        return Map.of("success", true, "message", "Station added to favorites.", "favorite", result);
    }

    @DeleteMapping("/favorites/{stationId}")
    public Map<String, Object> removeFavorite(Authentication authentication, @PathVariable String stationId) {
        favorites.deleteByUserIdAndStationId(userId(authentication), stationId);
        return Map.of("success", true, "message", "Station removed from favorites.");
    }

    @DeleteMapping("/favorites")
    public Map<String, Object> clearFavorites(Authentication authentication) {
        favorites.deleteByUserId(userId(authentication));
        return Map.of("success", true, "message", "Favorites cleared.");
    }

    @GetMapping("/reviews/{stationId}")
    public Map<String, Object> listReviews(@PathVariable String stationId) {
        List<Review> stationReviews = reviews.findAllByStationIdOrderByCreatedAtDesc(stationId);
        Map<Integer, Integer> distribution = new TreeMap<>();
        for (int rating = 1; rating <= 5; rating++) distribution.put(rating, 0);
        stationReviews.forEach(review -> distribution.computeIfPresent(review.getRating(), (key, count) -> count + 1));
        double average = stationReviews.stream().mapToInt(Review::getRating).average().orElse(0);
        return Map.of("success", true, "stationId", stationId, "averageRating", Math.round(average * 10) / 10.0,
                "totalReviews", stationReviews.size(), "distribution", distribution,
                "reviews", stationReviews.stream().map(this::reviewResponse).toList());
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> addReview(Authentication authentication, @RequestBody ReviewRequest request) {
        if (request.stationId() == null || request.stationId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station ID is required.");
        }
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5.");
        }
        if (request.comment() == null || request.comment().isBlank() || request.comment().length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review must contain 1 to 2000 characters.");
        }
        User user = currentUser(authentication);
        Review saved = reviews.save(new Review(user.getId(), user.getName(),
                request.stationId().trim(), request.rating(), request.comment().trim()));
        return Map.of("success", true, "message", "Review added successfully.", "review", reviewResponse(saved));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public Map<String, Object> removeReview(Authentication authentication, @PathVariable Long reviewId) {
        Review review = reviews.findByIdAndUserId(reviewId, userId(authentication))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found."));
        reviews.delete(review);
        return Map.of("success", true, "message", "Review removed.");
    }

    @GetMapping("/trip-history")
    public Map<String, Object> listTrips(Authentication authentication) {
        return Map.of("success", true,
                "trips", trips.findAllByUserIdOrderByCreatedAtDesc(userId(authentication))
                        .stream().map(this::tripResponse).toList());
    }

    @PostMapping("/trip-history")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> saveTrip(Authentication authentication, @RequestBody JsonNode body) {
        TripHistory trip = new TripHistory(userId(authentication));
        trip.setSource(text(body, "source", text(body, "start", text(body, "startLocation", null))));
        trip.setDestination(text(body, "destination", text(body, "destinationLocation", null)));
        trip.setDistanceKm(number(body, "distanceKm", number(body, "distance", 0)));
        trip.setDurationMinutes(number(body, "durationMinutes",
                number(body, "drivingTimeMinutes", number(body, "tripTime", 0))));
        trip.setVehicleId(text(body, "vehicleId", text(body, "vehicle", null)));
        trip.setBatteryStart(number(body, "batteryStart", number(body, "battery", 0)));
        trip.setArrivalBattery(number(body, "arrivalBattery", 0));
        trip.setNumberOfStops((int) number(body, "numberOfStops", number(body, "chargingStops", 0)));
        trip.setTotalCost(number(body, "totalCost",
                number(body, "chargingCost", number(body, "totalChargingCost", 0))));
        trip.setTotalEnergy(number(body, "totalEnergy", 0));
        trip.setTotalChargingTime(number(body, "totalChargingTime",
                number(body, "chargingTimeMinutes", number(body, "totalChargingTimeMinutes", 0))));
        trip.setRouteComplete(body.path("routeComplete").asBoolean(false));
        try {
            trip.setTripData(objectMapper.writeValueAsString(body));
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip details are not valid JSON.", exception);
        }
        TripHistory saved = trips.save(trip);
        return Map.of("success", true, "message", "Trip saved to history.", "trip", tripResponse(saved));
    }

    @DeleteMapping("/trip-history/{tripId}")
    public Map<String, Object> deleteTrip(Authentication authentication, @PathVariable Long tripId) {
        TripHistory trip = trips.findByIdAndUserId(tripId, userId(authentication))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip history record not found."));
        trips.delete(trip);
        return Map.of("success", true, "message", "Trip removed from history.");
    }

    @DeleteMapping("/trip-history")
    public Map<String, Object> clearTrips(
            Authentication authentication,
            @RequestParam(required = false) String confirm) {
        trips.deleteByUserId(userId(authentication));
        return Map.of("success", true, "message", "Trip history cleared.");
    }

    private Long userId(Authentication authentication) {
        return currentUser(authentication).getId();
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        return users.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found."));
    }

    private Map<String, Object> findStation(String id) {
        return apiController.getStations().stream()
                .filter(station -> String.valueOf(station.get("id")).equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Charging station not found."));
    }

    private Map<String, Object> reviewResponse(Review review) {
        return Map.of("id", review.getId(), "userId", review.getUserId(), "userName", review.getUserName(),
                "stationId", review.getStationId(), "rating", review.getRating(),
                "comment", review.getComment(), "createdAt", review.getCreatedAt());
    }

    private Map<String, Object> tripResponse(TripHistory trip) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", trip.getId());
        response.put("source", trip.getSource());
        response.put("start", trip.getSource());
        response.put("startLocation", trip.getSource());
        response.put("destination", trip.getDestination());
        response.put("distanceKm", trip.getDistanceKm());
        response.put("durationMinutes", trip.getDurationMinutes());
        response.put("vehicleId", trip.getVehicleId());
        response.put("vehicle", trip.getVehicleId());
        response.put("batteryStart", trip.getBatteryStart());
        response.put("battery", trip.getBatteryStart());
        response.put("arrivalBattery", trip.getArrivalBattery());
        response.put("numberOfStops", trip.getNumberOfStops());
        response.put("chargingStops", trip.getNumberOfStops());
        response.put("totalCost", trip.getTotalCost());
        response.put("chargingCost", trip.getTotalCost());
        response.put("totalChargingCost", trip.getTotalCost());
        response.put("totalChargingTimeMinutes", trip.getTotalChargingTime());
        response.put("chargingTimeMinutes", trip.getTotalChargingTime());
        response.put("routeComplete", trip.getRouteComplete());
        response.put("createdAt", trip.getCreatedAt());
        try {
            if (trip.getTripData() != null) response.put("tripData", objectMapper.readTree(trip.getTripData()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Saved trip data is malformed.", exception);
        }
        return response;
    }

    private String text(JsonNode data, String key, String fallback) {
        JsonNode value = data.get(key);
        return value == null || value.isNull() ? fallback : value.asText();
    }

    private double number(JsonNode data, String key, double fallback) {
        JsonNode value = data.get(key);
        return value == null || !value.isNumber() ? fallback : value.asDouble();
    }

    public record FavoriteRequest(String stationId) {}
    public record ReviewRequest(String stationId, Integer rating, String comment) {}
}
