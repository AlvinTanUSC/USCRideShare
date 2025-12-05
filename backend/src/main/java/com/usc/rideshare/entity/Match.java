package com.usc.rideshare.entity;

import com.usc.rideshare.entity.enums.MatchStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "match_id")
    private UUID matchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id_1", nullable = false)
    private Ride ride1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id_2", nullable = false)
    private Ride ride2;

    @Column(name = "match_score")
    private Double matchScore;

    @Convert(converter = com.usc.rideshare.config.MatchStatusConverter.class)
    @Column(name = "status", nullable = false, columnDefinition = "match_status")
    private MatchStatus status = MatchStatus.SUGGESTED;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;
    
    // Note: requested_by_user_id is not in the current database schema
    // We'll derive it from ride1's user for now
    @Transient
    private User requestedByUser;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = MatchStatus.SUGGESTED;
        }
    }

    @PostLoad
    protected void onLoad() {
        // Derive requestedByUser from ride1's user
        if (ride1 != null) {
            requestedByUser = ride1.getUser();
        }
    }

    public Match() {
    }

    public UUID getMatchId() {
        return matchId;
    }

    public void setMatchId(UUID matchId) {
        this.matchId = matchId;
    }

    public Ride getRide1() {
        return ride1;
    }

    public void setRide1(Ride ride1) {
        this.ride1 = ride1;
    }

    public Ride getRide2() {
        return ride2;
    }

    public void setRide2(Ride ride2) {
        this.ride2 = ride2;
    }

    public User getRequestedByUser() {
        return requestedByUser;
    }

    public void setRequestedByUser(User requestedByUser) {
        this.requestedByUser = requestedByUser;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
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
}

