package com.evsmartcharge.data;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(name = "favorites", uniqueConstraints =
        @UniqueConstraint(name = "uk_favorite_user_station", columnNames = {"user_id", "station_id"}))
public class Favorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "station_id", nullable = false, length = 80)
    private String stationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Favorite() {}

    public Favorite(Long userId, String stationId) {
        this.userId = userId;
        this.stationId = stationId;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getStationId() { return stationId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
