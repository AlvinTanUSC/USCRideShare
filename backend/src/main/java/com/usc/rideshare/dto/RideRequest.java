package com.usc.rideshare.dto;

import jakarta.validation.constraints.*;

import java.time.Instant;

public class RideRequest {

    @NotBlank(message = "Origin location is required")
    private String originLocation;

    @NotBlank(message = "Destination is required")
    @Pattern(regexp = "LAX|BUR|ONT|UNION_STATION",
             message = "Destination must be one of: LAX, BUR, ONT, UNION_STATION")
    private String destination;

    @NotNull(message = "Departure datetime is required")
    @Future(message = "Departure datetime must be in the future")
    private Instant departureDatetime;

    private Boolean flexibleTime = false;

    @Min(value = 0, message = "Time flexibility must be non-negative")
    private Integer timeFlexibilityMinutes = 0;

    @Min(value = 1, message = "Maximum passengers must be at least 1")
    @Max(value = 3, message = "Maximum passengers cannot exceed 3")
    private Integer maxPassengers = 2;

    @Pattern(regexp = "EQUAL|BY_DISTANCE",
             message = "Cost split preference must be EQUAL or BY_DISTANCE")
    private String costSplitPreference = "EQUAL";

    @Size(max = 300, message = "Notes cannot exceed 300 characters")
    private String notes;

    public RideRequest() {
    }

    public RideRequest(String originLocation, String destination, Instant departureDatetime,
                       Boolean flexibleTime, Integer timeFlexibilityMinutes, Integer maxPassengers,
                       String costSplitPreference, String notes) {
        this.originLocation = originLocation;
        this.destination = destination;
        this.departureDatetime = departureDatetime;
        this.flexibleTime = flexibleTime;
        this.timeFlexibilityMinutes = timeFlexibilityMinutes;
        this.maxPassengers = maxPassengers;
        this.costSplitPreference = costSplitPreference;
        this.notes = notes;
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
}
