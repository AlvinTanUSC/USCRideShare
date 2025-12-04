package com.usc.rideshare.entity;

import com.usc.rideshare.entity.enums.CostSplitPreference;
import com.usc.rideshare.entity.enums.RideStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rides")
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ride_id")
    private UUID rideId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "origin_location", nullable = false)
    private String originLocation;

    @Column(nullable = false)
    private String destination;

    @Column(name = "departure_datetime", nullable = false)
    private Instant departureDatetime;

    @Column(name = "flexible_time")
    private Boolean flexibleTime = false;

    @Column(name = "time_flexibility_minutes")
    private Integer timeFlexibilityMinutes = 0;

    @Column(name = "max_passengers")
    private Integer maxPassengers = 2;

    @Enumerated(EnumType.STRING)
    @Column(name = "cost_split_preference")
    private CostSplitPreference costSplitPreference = CostSplitPreference.EQUAL;

    @Column(length = 300)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RideStatus status = RideStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) {
            status = RideStatus.ACTIVE;
        }
        if (flexibleTime == null) {
            flexibleTime = false;
        }
        if (timeFlexibilityMinutes == null) {
            timeFlexibilityMinutes = 0;
        }
        if (maxPassengers == null) {
            maxPassengers = 2;
        }
        if (costSplitPreference == null) {
            costSplitPreference = CostSplitPreference.EQUAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Ride() {
    }

    public UUID getRideId() {
        return rideId;
    }

    public void setRideId(UUID rideId) {
        this.rideId = rideId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public CostSplitPreference getCostSplitPreference() {
        return costSplitPreference;
    }

    public void setCostSplitPreference(CostSplitPreference costSplitPreference) {
        this.costSplitPreference = costSplitPreference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public RideStatus getStatus() {
        return status;
    }

    public void setStatus(RideStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
