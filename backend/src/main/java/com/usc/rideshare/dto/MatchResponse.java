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

    // Nested objects for frontend compatibility
    private RideWithUser ride1;
    private RideWithUser ride2;

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

    public RideWithUser getRide1() {
        return ride1;
    }

    public void setRide1(RideWithUser ride1) {
        this.ride1 = ride1;
    }

    public RideWithUser getRide2() {
        return ride2;
    }

    public void setRide2(RideWithUser ride2) {
        this.ride2 = ride2;
    }

    // Nested class for ride with user data
    public static class RideWithUser {
        private UUID rideId;
        private String originLocation;
        private String destination;
        private Instant departureDatetime;
        private Boolean flexibleTime;
        private Integer timeFlexibilityMinutes;
        private Integer maxPassengers;
        private String costSplitPreference;
        private String notes;
        private String status;
        private UserInfo user;

        public RideWithUser() {}

        public UUID getRideId() {
            return rideId;
        }

        public void setRideId(UUID rideId) {
            this.rideId = rideId;
        }

        public String getOriginLocation() {
            return originLocation;
        }

        public void setOriginLocation(String originLocation) {
            this.originLocation = originLocation;
        }

        public String getDestination() {
            return destination;
        }

        public void setDestination(String destination) {
            this.destination = destination;
        }

        public Instant getDepartureDatetime() {
            return departureDatetime;
        }

        public void setDepartureDatetime(Instant departureDatetime) {
            this.departureDatetime = departureDatetime;
        }

        public Boolean getFlexibleTime() {
            return flexibleTime;
        }

        public void setFlexibleTime(Boolean flexibleTime) {
            this.flexibleTime = flexibleTime;
        }

        public Integer getTimeFlexibilityMinutes() {
            return timeFlexibilityMinutes;
        }

        public void setTimeFlexibilityMinutes(Integer timeFlexibilityMinutes) {
            this.timeFlexibilityMinutes = timeFlexibilityMinutes;
        }

        public Integer getMaxPassengers() {
            return maxPassengers;
        }

        public void setMaxPassengers(Integer maxPassengers) {
            this.maxPassengers = maxPassengers;
        }

        public String getCostSplitPreference() {
            return costSplitPreference;
        }

        public void setCostSplitPreference(String costSplitPreference) {
            this.costSplitPreference = costSplitPreference;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public UserInfo getUser() {
            return user;
        }

        public void setUser(UserInfo user) {
            this.user = user;
        }

        public static RideWithUser fromEntity(Ride ride) {
            RideWithUser dto = new RideWithUser();
            dto.setRideId(ride.getRideId());
            dto.setOriginLocation(ride.getOriginLocation());
            dto.setDestination(ride.getDestination());
            dto.setDepartureDatetime(ride.getDepartureDatetime());
            dto.setFlexibleTime(ride.getFlexibleTime());
            dto.setTimeFlexibilityMinutes(ride.getTimeFlexibilityMinutes());
            dto.setMaxPassengers(ride.getMaxPassengers());
            dto.setCostSplitPreference(ride.getCostSplitPreference().name());
            dto.setNotes(ride.getNotes());
            dto.setStatus(ride.getStatus().name());
            dto.setUser(UserInfo.fromEntity(ride.getUser()));
            return dto;
        }
    }

    // Nested class for user data
    public static class UserInfo {
        private UUID userId;
        private String firstName;
        private String lastName;
        private String email;

        public UserInfo() {}

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public static UserInfo fromEntity(com.usc.rideshare.entity.User user) {
            UserInfo dto = new UserInfo();
            dto.setUserId(user.getUserId());
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
            dto.setEmail(user.getEmail());
            return dto;
        }
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

        // Add nested ride objects for frontend
        response.setRide1(RideWithUser.fromEntity(match.getRide1()));
        response.setRide2(RideWithUser.fromEntity(match.getRide2()));

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

