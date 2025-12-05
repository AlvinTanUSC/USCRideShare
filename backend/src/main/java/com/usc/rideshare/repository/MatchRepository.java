package com.usc.rideshare.repository;

import com.usc.rideshare.entity.Match;
import com.usc.rideshare.entity.Ride;
import com.usc.rideshare.entity.User;
import com.usc.rideshare.entity.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {

    /**
     * Find matches for a specific ride (as ride1 or ride2)
     */
    @Query("SELECT m FROM Match m WHERE (m.ride1.rideId = :rideId OR m.ride2.rideId = :rideId)")
    List<Match> findByRideId(@Param("rideId") UUID rideId);

    /**
     * Find matches for a specific user (where they are the ride owner)
     */
    @Query("SELECT m FROM Match m WHERE " +
           "(m.ride1.user.userId = :userId OR m.ride2.user.userId = :userId)")
    List<Match> findByUserId(@Param("userId") UUID userId);

    /**
     * Find pending match requests for a user's rides
     * Note: Filtering by status is done in Java code to avoid PostgreSQL enum type issues
     */
    // findByUserIdAndStatus is implemented as a default method below

    /**
     * Check if a match already exists between two rides (in either direction)
     */
    @Query("SELECT m FROM Match m WHERE " +
           "((m.ride1.rideId = :ride1Id AND m.ride2.rideId = :ride2Id) OR " +
           "(m.ride1.rideId = :ride2Id AND m.ride2.rideId = :ride1Id))")
    Optional<Match> findExistingMatch(@Param("ride1Id") UUID ride1Id, @Param("ride2Id") UUID ride2Id);
    
    /**
     * Find matches by ride ID (using the correct column names)
     */
    @Query("SELECT m FROM Match m WHERE m.ride1.rideId = :rideId OR m.ride2.rideId = :rideId")
    List<Match> findAllByRideId(@Param("rideId") UUID rideId);

    /**
     * Find matches where a specific ride is involved and status matches
     * Note: Filtering by status is done in Java code to avoid PostgreSQL enum type issues
     */
    // findByRideIdAndStatus is implemented as a default method below
    
    /**
     * Default method to filter matches by status (avoids PostgreSQL enum casting issues)
     */
    default List<Match> findByUserIdAndStatus(UUID userId, MatchStatus status) {
        return findByUserId(userId).stream()
                .filter(m -> m.getStatus() == status)
                .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Default method to filter matches by ride ID and status
     */
    default List<Match> findByRideIdAndStatus(UUID rideId, MatchStatus status) {
        return findByRideId(rideId).stream()
                .filter(m -> m.getStatus() == status)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Count matches by status (using default method to avoid PostgreSQL enum casting issues)
     */
    default Long countByStatus(MatchStatus status) {
        if (status == null) {
            return 0L;
        }
        return findAll().stream()
                .filter(m -> m.getStatus() != null && m.getStatus() == status)
                .count();
    }
}

