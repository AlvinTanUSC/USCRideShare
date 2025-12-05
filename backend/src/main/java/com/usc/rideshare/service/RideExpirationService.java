package com.usc.rideshare.service;

import com.usc.rideshare.entity.Ride;
import com.usc.rideshare.entity.enums.RideStatus;
import com.usc.rideshare.repository.RideRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class RideExpirationService {

    private static final Logger logger = LoggerFactory.getLogger(RideExpirationService.class);

    @Autowired
    private RideRepository rideRepository;

    /**
     * Scheduled task that runs every hour to mark expired rides.
     * A ride is considered expired if:
     * - Status is ACTIVE (not matched, completed, or cancelled)
     * - Departure time + time flexibility has passed
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    @Transactional
    public void markExpiredRides() {
        logger.info("Running scheduled task to mark expired rides");

        try {
            // Find all active rides
            List<Ride> activeRides = rideRepository.findByStatusOrderByCreatedAtDesc(RideStatus.ACTIVE);

            Instant now = Instant.now();
            int expiredCount = 0;

            for (Ride ride : activeRides) {
                // Calculate expiration time: departure time + flexibility
                Instant expirationTime = ride.getDepartureDatetime()
                    .plusSeconds((long) ride.getTimeFlexibilityMinutes() * 60);

                // If current time is past expiration time, mark as expired
                if (now.isAfter(expirationTime)) {
                    ride.setStatus(RideStatus.EXPIRED);
                    rideRepository.save(ride);
                    expiredCount++;

                    logger.debug("Marked ride {} as EXPIRED (departure: {}, flexibility: {} min)",
                        ride.getRideId(),
                        ride.getDepartureDatetime(),
                        ride.getTimeFlexibilityMinutes());
                }
            }

            if (expiredCount > 0) {
                logger.info("Marked {} rides as EXPIRED", expiredCount);
            } else {
                logger.info("No rides to expire");
            }

        } catch (Exception e) {
            logger.error("Error while marking expired rides", e);
        }
    }
}
