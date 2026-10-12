package com.evsmartcharge.data;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findAllByStationIdOrderByCreatedAtDesc(String stationId);
    Optional<Review> findByIdAndUserId(Long id, Long userId);
}
