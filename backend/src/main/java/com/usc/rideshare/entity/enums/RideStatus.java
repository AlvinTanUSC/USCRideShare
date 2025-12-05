package com.usc.rideshare.entity.enums;

public enum RideStatus {
    ACTIVE,      // Ride is posted and looking for matches
    MATCHED,     // Ride has been matched with another rider
    COMPLETED,   // Ride has been completed
    CANCELLED,   // Ride was cancelled by user
    EXPIRED      // Ride departure time has passed without being matched
}
