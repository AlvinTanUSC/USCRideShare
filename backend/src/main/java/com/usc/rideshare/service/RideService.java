package com.usc.rideshare.service;

import com.usc.rideshare.dto.RideFilterRequest;
import com.usc.rideshare.dto.RideRequest;
import com.usc.rideshare.dto.RideResponse;
import com.usc.rideshare.entity.Ride;
import com.usc.rideshare.entity.User;
import com.usc.rideshare.entity.enums.CostSplitPreference;
import com.usc.rideshare.entity.enums.Destination;
import com.usc.rideshare.entity.enums.RideStatus;
import com.usc.rideshare.exception.RideNotFoundException;
import com.usc.rideshare.repository.RideRepository;
import com.usc.rideshare.repository.UserRepository;
import com.usc.rideshare.entity.Match;
import com.usc.rideshare.entity.enums.MatchStatus;
import com.usc.rideshare.repository.MatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;



@Service
public class RideService {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;

    public RideService(RideRepository rideRepository, UserRepository userRepository, MatchRepository matchRepository) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.matchRepository = matchRepository;
    }

    @Transactional
    public RideResponse createRide(RideRequest request, UUID userId) {
        // Validate destination
        if (!Destination.isValid(request.getDestination())) {
            throw new IllegalArgumentException("Invalid destination: " + request.getDestination());
        }

        // Validate flexibility
        if (Boolean.TRUE.equals(request.getFlexibleTime()) &&
            (request.getTimeFlexibilityMinutes() == null || request.getTimeFlexibilityMinutes() <= 0)) {
            throw new IllegalArgumentException("Time flexibility minutes must be greater than 0 when flexible time is enabled");
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create ride
        Ride ride = new Ride();
        ride.setUser(user);
        ride.setOriginLocation(request.getOriginLocation());
        ride.setDestination(request.getDestination());
        ride.setDepartureDatetime(request.getDepartureDatetime());
        ride.setFlexibleTime(request.getFlexibleTime() != null ? request.getFlexibleTime() : false);
        ride.setTimeFlexibilityMinutes(request.getTimeFlexibilityMinutes() != null ? request.getTimeFlexibilityMinutes() : 0);
        ride.setMaxPassengers(request.getMaxPassengers() != null ? request.getMaxPassengers() : 2);
        ride.setCostSplitPreference(CostSplitPreference.valueOf(
                request.getCostSplitPreference() != null ? request.getCostSplitPreference() : "EQUAL"));
        ride.setNotes(request.getNotes());
        ride.setStatus(RideStatus.ACTIVE);

        Ride savedRide = rideRepository.save(ride);
        return RideResponse.fromEntity(savedRide);
    }

    @Transactional(readOnly = true)
    public List<RideResponse> getRides(RideFilterRequest filters) {
        // Get all active rides using the existing method with RideStatus enum
        List<Ride> rides = rideRepository.findByStatusOrderByCreatedAtDesc(RideStatus.ACTIVE);

        // Apply destination filter if provided
        if (filters.getDestination() != null && !filters.getDestination().isEmpty()) {
            rides = rides.stream()
                    .filter(ride -> ride.getDestination().equals(filters.getDestination()))
                    .collect(Collectors.toList());
        }

        // Apply date filter if provided
        if (filters.getDate() != null) {
            Instant startOfDay = filters.getDate()
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant();
            Instant endOfDay = filters.getDate()
                    .plusDays(1)
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant();

            rides = rides.stream()
                    .filter(ride -> !ride.getDepartureDatetime().isBefore(startOfDay) &&
                                   ride.getDepartureDatetime().isBefore(endOfDay))
                    .collect(Collectors.toList());
        }

        // Apply time filter if provided
        if (filters.getTime() != null) {
            rides = filterByTime(rides, filters.getTime());
        }

        return rides.stream()
                .map(RideResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private List<Ride> filterByTime(List<Ride> rides, java.time.LocalTime filterTime) {
        return rides.stream()
                .filter(ride -> {
                    LocalDateTime rideDateTime = LocalDateTime.ofInstant(
                            ride.getDepartureDatetime(),
                            ZoneId.systemDefault()
                    );
                    java.time.LocalTime rideTime = rideDateTime.toLocalTime();

                    // Exact match
                    if (rideTime.equals(filterTime)) {
                        return true;
                    }

                    // Flexible match
                    if (Boolean.TRUE.equals(ride.getFlexibleTime()) && ride.getTimeFlexibilityMinutes() > 0) {
                        long minutesDiff = Math.abs(ChronoUnit.MINUTES.between(rideTime, filterTime));
                        return minutesDiff <= ride.getTimeFlexibilityMinutes();
                    }

                    return false;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RideResponse getRideById(UUID rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RideNotFoundException("Ride not found with id: " + rideId));
        return RideResponse.fromEntity(ride);
    }

    @Transactional(readOnly = true)
    public List<RideResponse> getRidesByUserId(UUID userId) {
        List<Ride> rides = rideRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        return rides.stream()
                .map(RideResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public RideResponse cancelRide(UUID rideId, UUID userId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RideNotFoundException("Ride not found with id: " + rideId));

        // Check ownership
        if (!ride.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only cancel your own rides");
        }

        // Check if already cancelled
        if (ride.getStatus() == RideStatus.CANCELLED) {
            throw new IllegalStateException("Ride is already cancelled");
        }

        // Check for active matches
        List<Match> activeMatches = matchRepository.findByRideId(rideId).stream()
                .filter(m -> m.getStatus() == MatchStatus.SUGGESTED || m.getStatus() == MatchStatus.ACCEPTED)
                .toList();

        if (!activeMatches.isEmpty()) {
            throw new IllegalStateException("Cannot cancel ride with active matches");
        }

        ride.setStatus(RideStatus.CANCELLED);
        Ride savedRide = rideRepository.save(ride);
        return RideResponse.fromEntity(savedRide);
    }
}
