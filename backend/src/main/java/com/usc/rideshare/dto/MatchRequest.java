package com.usc.rideshare.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class MatchRequest {

    @NotNull(message = "ride2Id is required")
    private UUID ride2Id;

    public MatchRequest() {
    }

    public MatchRequest(UUID ride2Id) {
        this.ride2Id = ride2Id;
    }

    public UUID getRide2Id() {
        return ride2Id;
    }

    public void setRide2Id(UUID ride2Id) {
        this.ride2Id = ride2Id;
    }
}

