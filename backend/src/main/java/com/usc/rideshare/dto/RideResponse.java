package com.usc.rideshare.dto;

import com.usc.rideshare.entity.Ride;

import java.time.Instant;
import java.util.UUID;

public class RideResponse {

    private UUID rideId;
    private UUID userId;
    private String posterFirstName;
    private String originLocation;
    private String destination;
    private Instant departureDatetime;
    private Boolean flexibleTime;
    private Integer timeFlexibilityMinutes;
    private Integer maxPassengers;
    private String costSplitPreference;
    private String notes;
    private String status;
    private Instant createdAt;

    public RideResponse() {
    }

    public RideResponse(UUID rideId, UUID userId, String posterFirstName, String originLocation,
                        String destination, Instant departureDatetime, Boolean flexibleTime,
                        Integer timeFlexibilityMinutes, Integer maxPassengers, String costSplitPreference,
                        String notes, String status, Instant createdAt) {
        this.rideId = rideId;
        this.userId = userId;
        this.posterFirstName = posterFirstName;
        this.originLocation = originLocation;
        this.destination = destination;
        this.departureDatetime = departureDatetime;
        this.flexibleTime = flexibleTime;
        this.timeFlexibilityMinutes = timeFlexibilityMinutes;
        this.maxPassengers = maxPassengers;
        this.costSplitPreference = costSplitPreference;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getRideId() {
        return rideId;
    }

    public void setRideId(UUID rideId) {
        this.rideId = rideId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getPosterFirstName() {
        return posterFirstName;
    }

    public void setPosterFirstName(String posterFirstName) {
        this.posterFirstName = posterFirstName;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public static RideResponse fromEntity(Ride ride) {
        RideResponse response = new RideResponse();
        response.setRideId(ride.getRideId());
        response.setUserId(ride.getUser().getUserId());
        response.setPosterFirstName(ride.getUser().getFirstName());
        response.setOriginLocation(ride.getOriginLocation());
        response.setDestination(ride.getDestination());
        response.setDepartureDatetime(ride.getDepartureDatetime());
        response.setFlexibleTime(ride.getFlexibleTime());
        response.setTimeFlexibilityMinutes(ride.getTimeFlexibilityMinutes());
        response.setMaxPassengers(ride.getMaxPassengers());
        response.setCostSplitPreference(ride.getCostSplitPreference().name());
        response.setNotes(ride.getNotes());
        response.setStatus(ride.getStatus().name());
        response.setCreatedAt(ride.getCreatedAt());
        return response;
    }
}
