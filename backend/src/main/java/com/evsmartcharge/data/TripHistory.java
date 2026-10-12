package com.evsmartcharge.data;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_history")
public class TripHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 250)
    private String source;

    @Column(length = 250)
    private String destination;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "duration_minutes")
    private Double durationMinutes;

    @Column(name = "vehicle_id", length = 120)
    private String vehicleId;

    @Column(name = "battery_start")
    private Double batteryStart;

    @Column(name = "arrival_battery")
    private Double arrivalBattery;

    @Column(name = "number_of_stops")
    private Integer numberOfStops;

    @Column(name = "total_cost")
    private Double totalCost;

    @Column(name = "total_energy")
    private Double totalEnergy;

    @Column(name = "total_charging_time")
    private Double totalChargingTime;

    @Column(name = "route_complete")
    private Boolean routeComplete;

    @Column(name = "trip_data", columnDefinition = "text")
    private String tripData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected TripHistory() {}

    public TripHistory(Long userId) {
        this.userId = userId;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
    public Double getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Double durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }
    public Double getBatteryStart() { return batteryStart; }
    public void setBatteryStart(Double batteryStart) { this.batteryStart = batteryStart; }
    public Double getArrivalBattery() { return arrivalBattery; }
    public void setArrivalBattery(Double arrivalBattery) { this.arrivalBattery = arrivalBattery; }
    public Integer getNumberOfStops() { return numberOfStops; }
    public void setNumberOfStops(Integer numberOfStops) { this.numberOfStops = numberOfStops; }
    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }
    public Double getTotalEnergy() { return totalEnergy; }
    public void setTotalEnergy(Double totalEnergy) { this.totalEnergy = totalEnergy; }
    public Double getTotalChargingTime() { return totalChargingTime; }
    public void setTotalChargingTime(Double totalChargingTime) { this.totalChargingTime = totalChargingTime; }
    public Boolean getRouteComplete() { return routeComplete; }
    public void setRouteComplete(Boolean routeComplete) { this.routeComplete = routeComplete; }
    public String getTripData() { return tripData; }
    public void setTripData(String tripData) { this.tripData = tripData; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
