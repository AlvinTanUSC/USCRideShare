package com.usc.rideshare.entity.enums;

public enum Destination {
    LAX,
    BUR,
    ONT,
    UNION_STATION;

    public static boolean isValid(String destination) {
        if (destination == null) {
            return false;
        }
        try {
            Destination.valueOf(destination.toUpperCase().replace(" ", "_"));
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public static Destination fromString(String destination) {
        return Destination.valueOf(destination.toUpperCase().replace(" ", "_"));
    }
}
