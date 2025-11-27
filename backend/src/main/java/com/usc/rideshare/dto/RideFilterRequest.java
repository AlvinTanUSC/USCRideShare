package com.usc.rideshare.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class RideFilterRequest {

    private String destination;  // LAX, BUR, ONT, UNION_STATION
    private LocalDate date;       // Filter by date
    private LocalTime time;       // Filter by time (with flexibility window)

    public RideFilterRequest() {
    }

    public RideFilterRequest(String destination, LocalDate date, LocalTime time) {
        this.destination = destination;
        this.date = date;
        this.time = time;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }
}
