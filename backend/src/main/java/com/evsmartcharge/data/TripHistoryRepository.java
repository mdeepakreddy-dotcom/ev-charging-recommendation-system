package com.evsmartcharge.data;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripHistoryRepository extends JpaRepository<TripHistory, Long> {
    List<TripHistory> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<TripHistory> findByIdAndUserId(Long id, Long userId);
    long deleteByUserId(Long userId);
}
