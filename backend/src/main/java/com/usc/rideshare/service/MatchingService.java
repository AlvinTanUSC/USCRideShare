package com.usc.rideshare.service;

import com.usc.rideshare.dto.MatchResponse;
import com.usc.rideshare.entity.Match;
import com.usc.rideshare.entity.Ride;
import com.usc.rideshare.entity.enums.MatchStatus;
import com.usc.rideshare.entity.enums.RideStatus;
import com.usc.rideshare.exception.RideNotFoundException;
import com.usc.rideshare.repository.MatchRepository;
import com.usc.rideshare.repository.RideRepository;
import com.usc.rideshare.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for automatic ride matching - similar to Uber/Lyft pool.
 * 
 * Flow:
 * 1. User creates a ride → system automatically finds compatible rides
 * 2. User sees potential matches and can JOIN one
 * 3. If no matches, ride stays in PENDING status waiting for others
 * 4. When new rides are created, they're automatically matched with pending rides
 */
@Service
public class MatchingService {

    private final MatchRepository matchRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    // Maximum time difference (in minutes) for matching non-flexible rides
    private static final int MAX_TIME_DIFFERENCE_MINUTES = 30;

    public MatchingService(MatchRepository matchRepository, RideRepository rideRepository, UserRepository userRepository) {
        this.matchRepository = matchRepository;
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    /**
     * Find potential matches for a ride.
     * Called automatically when a ride is created or when viewing a ride.
     * Returns compatible rides ranked by match score.
     */
    @Transactional(readOnly = true)
    public List<MatchResponse> findPotentialMatches(UUID rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RideNotFoundException("Ride not found with id: " + rideId));

        // Find all rides with same destination that are ACTIVE or PENDING (available to join)
        List<Ride> candidateRides = rideRepository.findByDestination(ride.getDestination())
                .stream()
                .filter(r -> !r.getRideId().equals(rideId)) // Exclude this ride
                .filter(r -> !r.getUser().getUserId().equals(ride.getUser().getUserId())) // Exclude own rides
                .filter(r -> r.getStatus() == RideStatus.ACTIVE) // Only available rides
                .filter(r -> r.getDepartureDatetime().isAfter(Instant.now())) // Only future rides
                .collect(Collectors.toList());

        // Filter out rides already matched with this ride
        Set<UUID> alreadyMatchedRideIds = getAlreadyMatchedRideIds(rideId);
        candidateRides = candidateRides.stream()
                .filter(r -> !alreadyMatchedRideIds.contains(r.getRideId()))
                .collect(Collectors.toList());

        // Check time compatibility and calculate match scores
        List<MatchCandidate> candidates = candidateRides.stream()
                .map(candidateRide -> {
                    if (areTimesCompatible(ride, candidateRide)) {
                        double score = calculateMatchScore(ride, candidateRide);
                        return new MatchCandidate(candidateRide, score);
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .sorted((a, b) -> Double.compare(b.score, a.score)) // Sort by score descending
                .collect(Collectors.toList());

        // Convert to MatchResponse DTOs with scores
        return candidates.stream()
                .map(candidate -> MatchResponse.fromPotentialMatch(candidate.ride, rideId, candidate.score))
                .collect(Collectors.toList());
    }

    /**
     * Get IDs of rides already matched with this ride (accepted or pending).
     */
    private Set<UUID> getAlreadyMatchedRideIds(UUID rideId) {
        return matchRepository.findByRideId(rideId).stream()
                .filter(m -> m.getStatus() != MatchStatus.DECLINED)
                .flatMap(m -> {
                    List<UUID> ids = new ArrayList<>();
                    if (m.getRide1() != null) ids.add(m.getRide1().getRideId());
                    if (m.getRide2() != null) ids.add(m.getRide2().getRideId());
                    return ids.stream();
                })
                .filter(id -> !id.equals(rideId))
                .collect(Collectors.toSet());
    }

    /**
     * Join an existing ride (automatic match).
     * User's ride joins another ride - no approval needed (like Uber pool).
     * 
     * @param myRideId The user's ride that wants to join
     * @param targetRideId The ride to join
     * @param userId The user making the request
     */
    @Transactional
    public MatchResponse joinRide(UUID myRideId, UUID targetRideId, UUID userId) {
        Ride myRide = rideRepository.findById(myRideId)
                .orElseThrow(() -> new RideNotFoundException("Your ride not found"));
        Ride targetRide = rideRepository.findById(targetRideId)
                .orElseThrow(() -> new RideNotFoundException("Target ride not found"));

        // Verify user owns myRide
        if (!myRide.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only join from your own ride");
        }

        // Verify rides have same destination
        if (!myRide.getDestination().equals(targetRide.getDestination())) {
            throw new IllegalArgumentException("Rides must have the same destination");
        }

        // Verify target ride is available
        if (targetRide.getStatus() != RideStatus.ACTIVE) {
            throw new IllegalArgumentException("Target ride is not available for matching");
        }

        // Verify my ride is available
        if (myRide.getStatus() == RideStatus.MATCHED || myRide.getStatus() == RideStatus.COMPLETED) {
            throw new IllegalArgumentException("Your ride is already matched or completed");
        }

        // Check time compatibility
        if (!areTimesCompatible(myRide, targetRide)) {
            throw new IllegalArgumentException("Ride times are not compatible");
        }

        // Check if match already exists
        Optional<Match> existingMatch = matchRepository.findExistingMatch(myRideId, targetRideId);
        if (existingMatch.isPresent()) {
            Match match = existingMatch.get();
            if (match.getStatus() == MatchStatus.ACCEPTED) {
                throw new IllegalArgumentException("Already matched with this ride");
            }
        }

        // Calculate match score
        double score = calculateMatchScore(myRide, targetRide);

        // Create the match (automatically ACCEPTED - no approval needed)
        Match match = new Match();
        match.setRide1(myRide);
        match.setRide2(targetRide);
        match.setMatchScore(score);
        match.setStatus(MatchStatus.ACCEPTED); // Auto-accept!
        match.setConfirmedAt(Instant.now());

        // Update both rides to MATCHED status
        myRide.setStatus(RideStatus.MATCHED);
        targetRide.setStatus(RideStatus.MATCHED);
        rideRepository.save(myRide);
        rideRepository.save(targetRide);

        Match savedMatch = matchRepository.save(match);
        return MatchResponse.fromEntity(savedMatch);
    }

    /**
     * Request to connect to a target ride (creates a PENDING match).
     * Does NOT mark rides as MATCHED — waits for accept/decline flow.
     */
    @Transactional
    public MatchResponse requestMatch(UUID myRideId, UUID targetRideId, UUID userId) {
        Ride myRide = rideRepository.findById(myRideId)
                .orElseThrow(() -> new RideNotFoundException("Your ride not found"));
        Ride targetRide = rideRepository.findById(targetRideId)
                .orElseThrow(() -> new RideNotFoundException("Target ride not found"));

        // Verify user owns myRide
        if (!myRide.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only request from your own ride");
        }

        // Same destination required
        if (!myRide.getDestination().equals(targetRide.getDestination())) {
            throw new IllegalArgumentException("Rides must have the same destination");
        }

        // Target must be available
        if (targetRide.getStatus() != RideStatus.ACTIVE) {
            throw new IllegalArgumentException("Target ride is not available for matching");
        }

        // My ride must be available
        if (myRide.getStatus() == RideStatus.MATCHED || myRide.getStatus() == RideStatus.COMPLETED) {
            throw new IllegalArgumentException("Your ride is already matched or completed");
        }

        // Time compatibility
        if (!areTimesCompatible(myRide, targetRide)) {
            throw new IllegalArgumentException("Ride times are not compatible");
        }

        // Prevent duplicate requests/accepted matches
        Optional<Match> existingMatch = matchRepository.findExistingMatch(myRideId, targetRideId);
        if (existingMatch.isPresent()) {
            Match m = existingMatch.get();
            if (m.getStatus() == com.usc.rideshare.entity.enums.MatchStatus.ACCEPTED) {
                throw new IllegalArgumentException("Already matched with this ride");
            }
            if (m.getStatus() == com.usc.rideshare.entity.enums.MatchStatus.PENDING) {
                // Return existing pending match
                return MatchResponse.fromEntity(m);
            }
        }

        double score = calculateMatchScore(myRide, targetRide);

        Match match = new Match();
        match.setRide1(myRide);     // requester
        match.setRide2(targetRide); // target
        match.setMatchScore(score);
        match.setStatus(com.usc.rideshare.entity.enums.MatchStatus.PENDING);

        Match saved = matchRepository.save(match);
        return MatchResponse.fromEntity(saved);
    }

    /**
     * Cancel/leave a match.
     * When cancelled, both rides go back to PENDING status.
     */
    @Transactional
    public void cancelMatch(UUID matchId, UUID userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        // Verify user is part of this match
        boolean isRide1Owner = match.getRide1().getUser().getUserId().equals(userId);
        boolean isRide2Owner = match.getRide2().getUser().getUserId().equals(userId);
        
        if (!isRide1Owner && !isRide2Owner) {
            throw new IllegalArgumentException("You are not part of this match");
        }

        // Set both rides back to ACTIVE (available for matching again)
        match.getRide1().setStatus(RideStatus.ACTIVE);
        match.getRide2().setStatus(RideStatus.ACTIVE);
        rideRepository.save(match.getRide1());
        rideRepository.save(match.getRide2());

        // Delete the match
        matchRepository.delete(match);
    }

    /**
     * Get user's current match (if any).
     */
    @Transactional(readOnly = true)
    public Optional<MatchResponse> getCurrentMatch(UUID userId) {
        List<Match> matches = matchRepository.findByUserId(userId);
        
        return matches.stream()
                .filter(m -> m.getStatus() == MatchStatus.ACCEPTED)
                .max(Comparator.comparing(Match::getConfirmedAt))
                .map(MatchResponse::fromEntity);
    }

    /**
     * Get all matches for a user.
     */
    @Transactional(readOnly = true)
    public List<MatchResponse> getUserMatches(UUID userId) {
        return matchRepository.findByUserId(userId).stream()
                .map(MatchResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get user's active/pending rides with their potential matches.
     */
    @Transactional(readOnly = true)
    public List<RideWithMatches> getUserRidesWithMatches(UUID userId) {
        List<Ride> userRides = rideRepository.findByUserUserId(userId);
        
        return userRides.stream()
                .filter(r -> r.getStatus() == RideStatus.ACTIVE)
                .filter(r -> r.getDepartureDatetime().isAfter(Instant.now()))
                .map(ride -> {
                    List<MatchResponse> potentialMatches = findPotentialMatches(ride.getRideId());
                    return new RideWithMatches(ride, potentialMatches);
                })
                .collect(Collectors.toList());
    }

    // ==================== Helper Methods ====================

    /**
     * Check if two rides have compatible departure times.
     */
    private boolean areTimesCompatible(Ride ride1, Ride ride2) {
        Instant time1 = ride1.getDepartureDatetime();
        Instant time2 = ride2.getDepartureDatetime();

        LocalDateTime ldt1 = LocalDateTime.ofInstant(time1, ZoneId.systemDefault());
        LocalDateTime ldt2 = LocalDateTime.ofInstant(time2, ZoneId.systemDefault());

        long minutesDiff = Math.abs(ChronoUnit.MINUTES.between(ldt1, ldt2));

        // Case 1: Both rides are flexible
        if (Boolean.TRUE.equals(ride1.getFlexibleTime()) && Boolean.TRUE.equals(ride2.getFlexibleTime())) {
            int flex1 = ride1.getTimeFlexibilityMinutes() != null ? ride1.getTimeFlexibilityMinutes() : 0;
            int flex2 = ride2.getTimeFlexibilityMinutes() != null ? ride2.getTimeFlexibilityMinutes() : 0;
            return minutesDiff <= (flex1 + flex2);
        }

        // Case 2: Ride1 is flexible
        if (Boolean.TRUE.equals(ride1.getFlexibleTime())) {
            int flex1 = ride1.getTimeFlexibilityMinutes() != null ? ride1.getTimeFlexibilityMinutes() : 0;
            return minutesDiff <= flex1;
        }

        // Case 3: Ride2 is flexible
        if (Boolean.TRUE.equals(ride2.getFlexibleTime())) {
            int flex2 = ride2.getTimeFlexibilityMinutes() != null ? ride2.getTimeFlexibilityMinutes() : 0;
            return minutesDiff <= flex2;
        }

        // Case 4: Neither is flexible
        return minutesDiff <= MAX_TIME_DIFFERENCE_MINUTES;
    }

    /**
     * Calculate a match score based on compatibility.
     * Higher score = better match.
     */
    private double calculateMatchScore(Ride ride1, Ride ride2) {
        double score = 100.0;

        // Time difference penalty
        Instant time1 = ride1.getDepartureDatetime();
        Instant time2 = ride2.getDepartureDatetime();
        LocalDateTime ldt1 = LocalDateTime.ofInstant(time1, ZoneId.systemDefault());
        LocalDateTime ldt2 = LocalDateTime.ofInstant(time2, ZoneId.systemDefault());
        long minutesDiff = Math.abs(ChronoUnit.MINUTES.between(ldt1, ldt2));
        score -= Math.min(50.0, minutesDiff * 0.5);

        // Bonus for matching cost split preferences
        if (ride1.getCostSplitPreference() == ride2.getCostSplitPreference()) {
            score += 10.0;
        }

        // Bonus for similar max passengers
        int passengerDiff = Math.abs(ride1.getMaxPassengers() - ride2.getMaxPassengers());
        score += (3 - passengerDiff) * 5.0;

        // Origin similarity bonus
        String origin1 = ride1.getOriginLocation().toLowerCase();
        String origin2 = ride2.getOriginLocation().toLowerCase();
        if (origin1.equals(origin2)) {
            score += 15.0;
        } else if (origin1.contains("usc") && origin2.contains("usc")) {
            score += 10.0;
        }

        return Math.max(0, score);
    }

    // ==================== Inner Classes ====================

    private static class MatchCandidate {
        final Ride ride;
        final double score;

        MatchCandidate(Ride ride, double score) {
            this.ride = ride;
            this.score = score;
        }
    }

    /**
     * DTO for ride with its potential matches.
     */
    public static class RideWithMatches {
        private final Ride ride;
        private final List<MatchResponse> potentialMatches;
        private final boolean hasPotentialMatches;

        public RideWithMatches(Ride ride, List<MatchResponse> potentialMatches) {
            this.ride = ride;
            this.potentialMatches = potentialMatches;
            this.hasPotentialMatches = !potentialMatches.isEmpty();
        }

        public Ride getRide() { return ride; }
        public List<MatchResponse> getPotentialMatches() { return potentialMatches; }
        public boolean hasPotentialMatches() { return hasPotentialMatches; }
    }
}
