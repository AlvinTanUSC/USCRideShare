package com.usc.rideshare.controller;

import com.usc.rideshare.dto.RideFilterRequest;
import com.usc.rideshare.dto.RideRequest;
import com.usc.rideshare.dto.RideResponse;
import com.usc.rideshare.service.RideService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    private final RideService rideService;

    public RideController(RideService rideService) {
        this.rideService = rideService;
    }

    @PostMapping
    public ResponseEntity<RideResponse> createRide(
            @Valid @RequestBody RideRequest request,
            HttpServletRequest servletRequest) {

        UUID userId = (UUID) servletRequest.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        RideResponse response = rideService.createRide(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RideResponse>> getRides(
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime time) {

        RideFilterRequest filters = new RideFilterRequest(destination, date, time);
        List<RideResponse> rides = rideService.getRides(filters);
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/my-rides")
    public ResponseEntity<List<RideResponse>> getMyRides(HttpServletRequest servletRequest) {
        UUID userId = (UUID) servletRequest.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<RideResponse> rides = rideService.getRidesByUserId(userId);
        return ResponseEntity.ok(rides);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RideResponse> getRideById(@PathVariable UUID id) {
        RideResponse ride = rideService.getRideById(id);
        return ResponseEntity.ok(ride);
    }
}

