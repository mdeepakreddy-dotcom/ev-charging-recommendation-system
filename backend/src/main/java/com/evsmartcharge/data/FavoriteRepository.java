package com.evsmartcharge.data;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndStationId(Long userId, String stationId);
    long deleteByUserIdAndStationId(Long userId, String stationId);
    long deleteByUserId(Long userId);
}
