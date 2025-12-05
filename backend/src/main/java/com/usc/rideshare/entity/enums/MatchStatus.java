package com.usc.rideshare.entity.enums;

public enum MatchStatus {
    PENDING,    // Match request sent, waiting for response
    ACCEPTED,   // Both parties accepted the match
    DECLINED    // Match request was declined
}

