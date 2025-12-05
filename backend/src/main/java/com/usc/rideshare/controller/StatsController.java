package com.usc.rideshare.controller;

import com.usc.rideshare.entity.enums.MatchStatus;
import com.usc.rideshare.repository.MatchRepository;
import com.usc.rideshare.repository.RideRepository;
import com.usc.rideshare.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final RideRepository rideRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    public StatsController(RideRepository rideRepository,
                          MatchRepository matchRepository,
                          UserRepository userRepository) {
        this.rideRepository = rideRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
    }

    /**
     * Public endpoint for login page stats
     */
    @GetMapping("/public")
    public Map<String, Object> getPublicStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            System.out.println("DEBUG: Starting stats fetch...");

            // Count total users
            long totalUsers = userRepository.count();
            System.out.println("DEBUG: Total users = " + totalUsers);
            stats.put("totalUsers", totalUsers);

            // Count total rides
            long totalRides = rideRepository.count();
            System.out.println("DEBUG: Total rides = " + totalRides);
            stats.put("totalRides", totalRides);

            // Count total matches (all statuses)
            long totalMatches = matchRepository.count();
            System.out.println("DEBUG: Total matches = " + totalMatches);
            stats.put("totalMatches", totalMatches);

            // Count accepted matches (for rides shared)
            System.out.println("DEBUG: Fetching accepted matches...");
            long acceptedMatches = matchRepository.countByStatus(MatchStatus.ACCEPTED);
            System.out.println("DEBUG: Accepted matches = " + acceptedMatches);
            stats.put("acceptedMatches", acceptedMatches);

            // Get popular destinations (top 5)
            System.out.println("DEBUG: Fetching popular destinations...");
            List<Object[]> topDestinations = rideRepository.findTopDestinations();
            System.out.println("DEBUG: Popular destinations count = " + (topDestinations != null ? topDestinations.size() : 0));
            if (topDestinations != null && !topDestinations.isEmpty()) {
                System.out.println("DEBUG: First destination = " + topDestinations.get(0)[0] + ", count = " + topDestinations.get(0)[1]);
            }
            stats.put("popularDestinations", topDestinations != null ? topDestinations : List.of());

            System.out.println("DEBUG: Final stats = " + stats);
        } catch (Exception e) {
            System.err.println("Error fetching stats: " + e.getMessage());
            e.printStackTrace();
            // Return zeros on error
            stats.put("totalUsers", 0L);
            stats.put("totalRides", 0L);
            stats.put("totalMatches", 0L);
            stats.put("acceptedMatches", 0L);
            stats.put("popularDestinations", List.of());
        }

        return stats;
    }
}
