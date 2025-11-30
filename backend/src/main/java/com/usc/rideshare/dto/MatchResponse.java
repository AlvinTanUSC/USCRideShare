package com.usc.rideshare.dto;

import com.usc.rideshare.entity.Match;
import com.usc.rideshare.entity.Ride;

import java.time.Instant;
import java.util.UUID;

public class MatchResponse {

    private UUID matchId;
    private UUID ride1Id;
    private UUID ride2Id;
    private UUID ride1OwnerId;
    private UUID ride2OwnerId;
    private String ride1OwnerName;
    private String ride2OwnerName;
    private UUID requestedByUserId;
    private String status;
    private Double matchScore;
    private Instant createdAt;
    private Instant confirmedAt;

    // Additional ride details for potential matches (when ride2Id is the candidate)
    private UUID candidateRideId; // The ride being suggested as a match
    private String candidateOrigin;
    private String candidateDestination;
    private Instant candidateDepartureTime;
    private Boolean candidateFlexibleTime;
    private Integer candidateTimeFlexibilityMinutes;
    private Integer candidateMaxPassengers;
    private String candidateCostSplitPreference;
    private String candidateNotes;
    private String candidateOwnerName;

    public MatchResponse() {
    }

    public UUID getMatchId() {
        return matchId;
    }

    public void setMatchId(UUID matchId) {
        this.matchId = matchId;
    }

    public UUID getRide1Id() {
        return ride1Id;
    }

    public void setRide1Id(UUID ride1Id) {
        this.ride1Id = ride1Id;
    }

    public UUID getRide2Id() {
        return ride2Id;
    }

    public void setRide2Id(UUID ride2Id) {
        this.ride2Id = ride2Id;
    }

    public UUID getRide1OwnerId() {
        return ride1OwnerId;
    }

    public void setRide1OwnerId(UUID ride1OwnerId) {
        this.ride1OwnerId = ride1OwnerId;
    }

    public UUID getRide2OwnerId() {
        return ride2OwnerId;
    }

    public void setRide2OwnerId(UUID ride2OwnerId) {
        this.ride2OwnerId = ride2OwnerId;
    }

    public String getRide1OwnerName() {
        return ride1OwnerName;
    }

    public void setRide1OwnerName(String ride1OwnerName) {
        this.ride1OwnerName = ride1OwnerName;
    }

    public String getRide2OwnerName() {
        return ride2OwnerName;
    }

    public void setRide2OwnerName(String ride2OwnerName) {
        this.ride2OwnerName = ride2OwnerName;
    }

    public UUID getRequestedByUserId() {
        return requestedByUserId;
    }

    public void setRequestedByUserId(UUID requestedByUserId) {
        this.requestedByUserId = requestedByUserId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public UUID getCandidateRideId() {
        return candidateRideId;
    }

    public void setCandidateRideId(UUID candidateRideId) {
        this.candidateRideId = candidateRideId;
    }

    public String getCandidateOrigin() {
        return candidateOrigin;
    }

    public void setCandidateOrigin(String candidateOrigin) {
        this.candidateOrigin = candidateOrigin;
    }

    public String getCandidateDestination() {
        return candidateDestination;
    }

    public void setCandidateDestination(String candidateDestination) {
        this.candidateDestination = candidateDestination;
    }

    public Instant getCandidateDepartureTime() {
        return candidateDepartureTime;
    }

    public void setCandidateDepartureTime(Instant candidateDepartureTime) {
        this.candidateDepartureTime = candidateDepartureTime;
    }

    public Boolean getCandidateFlexibleTime() {
        return candidateFlexibleTime;
    }

    public void setCandidateFlexibleTime(Boolean candidateFlexibleTime) {
        this.candidateFlexibleTime = candidateFlexibleTime;
    }

    public Integer getCandidateTimeFlexibilityMinutes() {
        return candidateTimeFlexibilityMinutes;
    }

    public void setCandidateTimeFlexibilityMinutes(Integer candidateTimeFlexibilityMinutes) {
        this.candidateTimeFlexibilityMinutes = candidateTimeFlexibilityMinutes;
    }

    public Integer getCandidateMaxPassengers() {
        return candidateMaxPassengers;
    }

    public void setCandidateMaxPassengers(Integer candidateMaxPassengers) {
        this.candidateMaxPassengers = candidateMaxPassengers;
    }

    public String getCandidateCostSplitPreference() {
        return candidateCostSplitPreference;
    }

    public void setCandidateCostSplitPreference(String candidateCostSplitPreference) {
        this.candidateCostSplitPreference = candidateCostSplitPreference;
    }

    public String getCandidateNotes() {
        return candidateNotes;
    }

    public void setCandidateNotes(String candidateNotes) {
        this.candidateNotes = candidateNotes;
    }

    public String getCandidateOwnerName() {
        return candidateOwnerName;
    }

    public void setCandidateOwnerName(String candidateOwnerName) {
        this.candidateOwnerName = candidateOwnerName;
    }

    /**
     * Create MatchResponse from Match entity.
     */
    public static MatchResponse fromEntity(Match match) {
        MatchResponse response = new MatchResponse();
        response.setMatchId(match.getMatchId());
        response.setRide1Id(match.getRide1().getRideId());
        response.setRide2Id(match.getRide2().getRideId());
        response.setRide1OwnerId(match.getRide1().getUser().getUserId());
        response.setRide2OwnerId(match.getRide2().getUser().getUserId());
        response.setRide1OwnerName(match.getRide1().getUser().getFirstName());
        response.setRide2OwnerName(match.getRide2().getUser().getFirstName());
        // requestedByUser is derived from ride1's user (since it's @Transient)
        if (match.getRequestedByUser() != null) {
            response.setRequestedByUserId(match.getRequestedByUser().getUserId());
        } else {
            response.setRequestedByUserId(match.getRide1().getUser().getUserId());
        }
        response.setStatus(match.getStatus().name());
        response.setMatchScore(match.getMatchScore());
        response.setCreatedAt(match.getCreatedAt());
        response.setConfirmedAt(match.getConfirmedAt());
        return response;
    }

    /**
     * Create MatchResponse from a candidate Ride (for potential matches).
     */
    public static MatchResponse fromRide(Ride candidateRide, UUID requestingRideId) {
        return fromPotentialMatch(candidateRide, requestingRideId, null);
    }

    /**
     * Create MatchResponse from a potential match with score.
     */
    public static MatchResponse fromPotentialMatch(Ride candidateRide, UUID requestingRideId, Double score) {
        MatchResponse response = new MatchResponse();
        response.setCandidateRideId(candidateRide.getRideId());
        response.setRide1Id(requestingRideId);
        response.setRide2Id(candidateRide.getRideId());
        response.setRide2OwnerId(candidateRide.getUser().getUserId());
        response.setRide2OwnerName(candidateRide.getUser().getFirstName());
        response.setCandidateOrigin(candidateRide.getOriginLocation());
        response.setCandidateDestination(candidateRide.getDestination());
        response.setCandidateDepartureTime(candidateRide.getDepartureDatetime());
        response.setCandidateFlexibleTime(candidateRide.getFlexibleTime());
        response.setCandidateTimeFlexibilityMinutes(candidateRide.getTimeFlexibilityMinutes());
        response.setCandidateMaxPassengers(candidateRide.getMaxPassengers());
        response.setCandidateCostSplitPreference(candidateRide.getCostSplitPreference().name());
        response.setCandidateNotes(candidateRide.getNotes());
        response.setCandidateOwnerName(candidateRide.getUser().getFirstName());
        response.setMatchScore(score);
        response.setStatus("AVAILABLE"); // Indicates this is a potential match, not yet joined
        return response;
    }
}

