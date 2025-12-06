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
import java.util.LinkedList;
import java.util.Queue;

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

        // Find all rides with same destination that are ACTIVE (available to join)
        List<Ride> candidateRides = rideRepository.findByDestination(ride.getDestination())
                .stream()
                .filter(r -> !r.getRideId().equals(rideId)) // Exclude this ride
                .filter(r -> !r.getUser().getUserId().equals(ride.getUser().getUserId())) // Exclude own rides
                .filter(r -> r.getStatus() == RideStatus.ACTIVE) // Only available rides (excludes EXPIRED)
                .filter(r -> r.getDepartureDatetime().isAfter(Instant.now())) // Only future rides
                .collect(Collectors.toList());

        // Filter out rides already matched with this ride
        Set<UUID> alreadyMatchedRideIds = getAlreadyMatchedRideIds(rideId);
        candidateRides = candidateRides.stream()
                .filter(r -> !alreadyMatchedRideIds.contains(r.getRideId()))
                .collect(Collectors.toList());

        // Use a Queue to process candidate rides in FIFO order for match scoring
        // This demonstrates Queue data structure usage for sequential processing
        Queue<Ride> rideProcessingQueue = new LinkedList<>(candidateRides);
        List<MatchCandidate> candidates = new ArrayList<>();

        // Process each ride from the queue
        while (!rideProcessingQueue.isEmpty()) {
            Ride candidateRide = rideProcessingQueue.poll(); // Dequeue from front
            if (areTimesCompatible(ride, candidateRide)) {
                double score = calculateMatchScore(ride, candidateRide);
                candidates.add(new MatchCandidate(candidateRide, score));
            }
        }

        // Sort candidates by score descending
        candidates.sort((a, b) -> Double.compare(b.score, a.score));

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
                .filter(m -> m.getStatus() != MatchStatus.REJECTED)
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
            if (m.getStatus() == com.usc.rideshare.entity.enums.MatchStatus.SUGGESTED) {
                // Return existing suggested match
                return MatchResponse.fromEntity(m);
            }
        }

        double score = calculateMatchScore(myRide, targetRide);

        Match match = new Match();
        match.setRide1(myRide);     // requester
        match.setRide2(targetRide); // target
        match.setMatchScore(score);
        match.setStatus(com.usc.rideshare.entity.enums.MatchStatus.SUGGESTED);

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
     * Complete a match (mark rideshare as successfully completed).
     * Both rides are marked as COMPLETED and the match status is set to COMPLETED.
     */
    @Transactional
    public MatchResponse completeMatch(UUID matchId, UUID userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        // Verify user is part of this match
        boolean isRide1Owner = match.getRide1().getUser().getUserId().equals(userId);
        boolean isRide2Owner = match.getRide2().getUser().getUserId().equals(userId);

        if (!isRide1Owner && !isRide2Owner) {
            throw new IllegalArgumentException("You are not part of this match");
        }

        // Verify match is in ACCEPTED status
        if (match.getStatus() != MatchStatus.ACCEPTED) {
            throw new IllegalArgumentException("Can only complete matches that are in ACCEPTED status");
        }

        // Mark match as completed
        match.setStatus(MatchStatus.COMPLETED);
        match.setCompletedAt(Instant.now());

        // Mark both rides as completed
        match.getRide1().setStatus(RideStatus.COMPLETED);
        match.getRide2().setStatus(RideStatus.COMPLETED);
        rideRepository.save(match.getRide1());
        rideRepository.save(match.getRide2());

        Match savedMatch = matchRepository.save(match);
        return MatchResponse.fromEntity(savedMatch);
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
     * Get a specific match by ID.
     */
    @Transactional(readOnly = true)
    public MatchResponse getMatchById(UUID matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        return MatchResponse.fromEntity(match);
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

    /**
     * Update match status (SUGGESTED, ACCEPTED, REJECTED).
     */
    @Transactional
    public MatchResponse updateMatchStatus(UUID matchId, String statusStr, UUID userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        // Verify user is part of the match
        boolean isUserInMatch = match.getRide1().getUser().getUserId().equals(userId) ||
                               match.getRide2().getUser().getUserId().equals(userId);

        if (!isUserInMatch) {
            throw new IllegalArgumentException("User is not part of this match");
        }

        // Parse and set the new status
        try {
            MatchStatus newStatus = MatchStatus.valueOf(statusStr.toUpperCase());
            match.setStatus(newStatus);

            // If accepted, set confirmed time
            if (newStatus == MatchStatus.ACCEPTED && match.getConfirmedAt() == null) {
                match.setConfirmedAt(Instant.now());
            }

            match = matchRepository.save(match);
            return MatchResponse.fromEntity(match);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + statusStr);
        }
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
     * Score is normalized between 0.0 and 1.0 to satisfy database constraint.
     */
    private double calculateMatchScore(Ride ride1, Ride ride2) {
        double score = 1.0; // Start at perfect match

        // Time difference penalty (max penalty: 0.5)
        Instant time1 = ride1.getDepartureDatetime();
        Instant time2 = ride2.getDepartureDatetime();
        LocalDateTime ldt1 = LocalDateTime.ofInstant(time1, ZoneId.systemDefault());
        LocalDateTime ldt2 = LocalDateTime.ofInstant(time2, ZoneId.systemDefault());
        long minutesDiff = Math.abs(ChronoUnit.MINUTES.between(ldt1, ldt2));
        score -= Math.min(0.5, minutesDiff * 0.005); // 0.5% penalty per minute, max 50%

        // Bonus for matching cost split preferences (10%)
        if (ride1.getCostSplitPreference() == ride2.getCostSplitPreference()) {
            score += 0.1;
        }

        // Bonus for similar max passengers (up to 15%)
        int passengerDiff = Math.abs(ride1.getMaxPassengers() - ride2.getMaxPassengers());
        score += (3 - passengerDiff) * 0.05; // 5% per matching passenger preference

        // Origin similarity bonus (15% for exact, 10% for USC area)
        String origin1 = ride1.getOriginLocation().toLowerCase();
        String origin2 = ride2.getOriginLocation().toLowerCase();
        if (origin1.equals(origin2)) {
            score += 0.15;
        } else if (origin1.contains("usc") && origin2.contains("usc")) {
            score += 0.10;
        }

        // Clamp score between 0.0 and 1.0 to satisfy database constraint
        return Math.max(0.0, Math.min(1.0, score));
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
