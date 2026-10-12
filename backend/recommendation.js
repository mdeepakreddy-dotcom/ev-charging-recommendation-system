// =====================================================
// EV CHARGING STATION RECOMMENDATION ENGINE
// =====================================================


// -----------------------------------------------------
// Calculate distance between two locations
// Returns distance in kilometers
// -----------------------------------------------------
function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


// -----------------------------------------------------
// Calculate remaining driving range
// -----------------------------------------------------
function calculateRemainingRange(
    batteryPercentage,
    maxRange
) {

    return (
        batteryPercentage / 100
    ) * maxRange;
}


// -----------------------------------------------------
// Check whether vehicle can reach the station
// -----------------------------------------------------
function checkReachability(
    distance,
    remainingRange
) {

    // Keep 15% of the remaining range as safety reserve
    const safetyReserve =
        remainingRange * 0.15;

    const requiredRange =
        distance + safetyReserve;


    // Safe
    if (requiredRange <= remainingRange) {

        return {
            status: "SAFE",
            message:
                "Vehicle can safely reach this station"
        };
    }


    // Can reach, but reserve is low
    if (distance <= remainingRange) {

        return {
            status: "LOW_RESERVE",
            message:
                "Vehicle can reach the station, but battery reserve will be low"
        };
    }


    // Cannot reach
    return {
        status: "UNREACHABLE",
        message:
            "Vehicle may not be able to reach this station"
    };
}


// -----------------------------------------------------
// Check connector compatibility
// -----------------------------------------------------
function checkConnectorCompatibility(
    vehicleConnector,
    stationConnectors
) {

    return stationConnectors.some(
        connector =>
            connector.toLowerCase() ===
            vehicleConnector.toLowerCase()
    );
}


// -----------------------------------------------------
// Calculate recommendation score
// -----------------------------------------------------
function calculateScore(
    station,
    distance
) {

    // ---------------------------------------------
    // Distance Score
    // ---------------------------------------------
    const distanceScore =
        Math.max(
            0,
            100 - (distance * 10)
        );


    // ---------------------------------------------
    // Availability Score
    // ---------------------------------------------
    const availabilityScore =
        station.totalChargers > 0
            ? (
                station.availableChargers /
                station.totalChargers
            ) * 100
            : 0;


    // ---------------------------------------------
    // Waiting Time Score
    // ---------------------------------------------
    const waitingScore =
        Math.max(
            0,
            100 - (station.waitingTime * 4)
        );


    // ---------------------------------------------
    // Charging Speed Score
    // ---------------------------------------------
    const speedScore =
        Math.min(
            100,
            (station.chargingSpeed / 150) * 100
        );


    // ---------------------------------------------
    // Price Score
    // ---------------------------------------------
    const priceScore =
        Math.max(
            0,
            100 - (
                (station.pricePerKwh - 8) * 10
            )
        );


    // ---------------------------------------------
    // Rating Score
    // ---------------------------------------------
    const ratingScore =
        (station.rating / 5) * 100;


    // ---------------------------------------------
    // Final Weighted Score
    // ---------------------------------------------
    const score =
        (distanceScore * 0.25) +
        (availabilityScore * 0.20) +
        (waitingScore * 0.15) +
        (speedScore * 0.15) +
        (priceScore * 0.10) +
        (ratingScore * 0.15);


    return Math.round(score);
}


// -----------------------------------------------------
// Export all functions
// -----------------------------------------------------
module.exports = {

    calculateDistance,

    calculateRemainingRange,

    checkReachability,

    checkConnectorCompatibility,

    calculateScore

};