package com.usc.rideshare.repository;

import com.usc.rideshare.entity.Ride;
import com.usc.rideshare.entity.enums.RideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface RideRepository extends JpaRepository<Ride, UUID> {

    // Find all active rides using Spring Data JPA method name
    List<Ride> findByStatusOrderByCreatedAtDesc(RideStatus status);

    // Find rides by user
    List<Ride> findByUser_UserIdOrderByCreatedAtDesc(UUID userId);

    // Find rides by user ID (simpler name for matching service)
    List<Ride> findByUserUserId(UUID userId);

    // Find rides by destination
    List<Ride> findByDestination(String destination);

    // Find rides by destination and status
    List<Ride> findByDestinationAndStatus(String destination, RideStatus status);

    // Get top destinations with ride count
    @Query("SELECT r.destination, COUNT(r) FROM Ride r GROUP BY r.destination ORDER BY COUNT(r) DESC")
    List<Object[]> findTopDestinations();
}
