package com.usc.rideshare.controller;

import com.usc.rideshare.dto.MatchResponse;
import com.usc.rideshare.service.MatchingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller for ride matching - Uber/Lyft pool style.
 * 
 * Flow:
 * 1. User creates ride → GET /api/matches/potential/{rideId} to see available rides to join
 * 2. User sees options → POST /api/matches/join to join a ride
 * 3. If no matches → ride stays pending, check back later
 * 4. Cancel match → DELETE /api/matches/{matchId}
 */
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchingService matchingService;

    public MatchController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    /**
     * GET /api/matches/potential/{rideId}
     * Find available rides to join (potential matches).
     * Returns a list of compatible rides ranked by match score.
     */
    @GetMapping("/potential/{rideId}")
    public ResponseEntity<List<MatchResponse>> findPotentialMatches(
            @PathVariable UUID rideId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<MatchResponse> matches = matchingService.findPotentialMatches(rideId);
        return ResponseEntity.ok(matches);
    }

    /**
     * POST /api/matches/join
     * Join an existing ride (automatic match - no approval needed).
     * Body: { "myRideId": "...", "targetRideId": "..." }
     */
    @PostMapping("/join")
    public ResponseEntity<?> joinRide(
            @RequestBody JoinRideRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (request.getMyRideId() == null || request.getTargetRideId() == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Both myRideId and targetRideId are required");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            MatchResponse match = matchingService.joinRide(
                    request.getMyRideId(), 
                    request.getTargetRideId(), 
                    userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(match);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * DELETE /api/matches/{matchId}
     * Cancel/leave a match. Both rides go back to PENDING status.
     */
    @DeleteMapping("/{matchId}")
    public ResponseEntity<?> cancelMatch(
            @PathVariable UUID matchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            matchingService.cancelMatch(matchId, userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Match cancelled successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET /api/matches/current
     * Get user's current active match (if any).
     */
    @GetMapping("/current")
    public ResponseEntity<?> getCurrentMatch(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<MatchResponse> match = matchingService.getCurrentMatch(userId);
        if (match.isPresent()) {
            return ResponseEntity.ok(match.get());
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "No active match found");
            response.put("hasMatch", "false");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * GET /api/matches
     * Get all matches for the current user (history).
     */
    @GetMapping
    public ResponseEntity<List<MatchResponse>> getUserMatches(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<MatchResponse> matches = matchingService.getUserMatches(userId);
        return ResponseEntity.ok(matches);
    }

    /**
     * GET /api/matches/my-rides
     * Get user's pending rides with their potential matches.
     * This is the main dashboard view - shows each of user's rides and what they can join.
     */
    @GetMapping("/my-rides")
    public ResponseEntity<List<MatchingService.RideWithMatches>> getMyRidesWithMatches(
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<MatchingService.RideWithMatches> ridesWithMatches = 
                matchingService.getUserRidesWithMatches(userId);
        return ResponseEntity.ok(ridesWithMatches);
    }

    // ==================== Request DTOs ====================

    /**
     * Request body for joining a ride.
     */
    public static class JoinRideRequest {
        private UUID myRideId;
        private UUID targetRideId;

        public UUID getMyRideId() { return myRideId; }
        public void setMyRideId(UUID myRideId) { this.myRideId = myRideId; }
        public UUID getTargetRideId() { return targetRideId; }
        public void setTargetRideId(UUID targetRideId) { this.targetRideId = targetRideId; }
    }
}
