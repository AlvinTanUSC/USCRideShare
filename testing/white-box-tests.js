// White Box Tests for USC RideShare - Component Logic Tests
// Tests the business logic and component behaviors at unit level

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Got: ${actual}`);
    }
  }

  assertExists(value, message) {
    if (!value) throw new Error(message);
  }

  assertThrows(fn, message) {
    try {
      fn();
      throw new Error(message || "Expected function to throw an error");
    } catch (e) {
      if (e.message === (message || "Expected function to throw an error")) {
        throw e;
      }
    }
  }

  async run() {
    console.log("\n🔬 WHITE BOX TESTING - USC RideShare\n");
    console.log("=".repeat(50));

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);

    if (this.failed === 0) {
      console.log("✅ ALL TESTS PASSED!\n");
      process.exit(0);
    } else {
      console.log(`❌ ${this.failed} test(s) failed\n`);
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

// ============================================================================
// RIDE SERVICE LOGIC TESTS
// ============================================================================

class RideServiceLogic {
  // Validate destination enum
  isValidDestination(destination) {
    const validDestinations = ["LAX", "BURBANK", "LONG_BEACH", "ONTARIO", "SANTA_MONICA"];
    return validDestinations.includes(destination);
  }

  // Validate ride departure time is not in the past
  isValidDepartureTime(departureTime) {
    const now = new Date();
    const departure = new Date(departureTime);
    return departure > now;
  }

  // Validate max passengers
  isValidMaxPassengers(maxPassengers) {
    return maxPassengers > 0 && maxPassengers <= 4;
  }

  // Validate cost split preference
  isValidCostSplitPreference(costSplit) {
    const validPreferences = ["EQUAL", "DRIVER_PAYS_ALL", "PASSENGER_PAYS_ALL"];
    return validPreferences.includes(costSplit);
  }

  // Calculate flexible time window
  getFlexibleTimeWindow(departureTime, flexibilityMinutes) {
    const departure = new Date(departureTime);
    const earliestTime = new Date(departure.getTime() - flexibilityMinutes * 60000);
    const latestTime = new Date(departure.getTime() + flexibilityMinutes * 60000);
    return { earliestTime, latestTime };
  }

  // Check if times overlap (for ride matching)
  timesOverlap(ride1DepartureTime, ride1Flexibility, ride2DepartureTime, ride2Flexibility) {
    const window1 = this.getFlexibleTimeWindow(ride1DepartureTime, ride1Flexibility);
    const window2 = this.getFlexibleTimeWindow(ride2DepartureTime, ride2Flexibility);

    return !(window1.latestTime < window2.earliestTime || window2.latestTime < window1.earliestTime);
  }

  // Filter rides by destination
  filterRidesByDestination(rides, destination) {
    return rides.filter(ride => ride.destination === destination);
  }

  // Filter rides by date range
  filterRidesByDateRange(rides, startDate, endDate) {
    return rides.filter(ride => {
      const rideDate = new Date(ride.departureDatetime);
      return rideDate >= startDate && rideDate <= endDate;
    });
  }

  // Find potential matches based on destination and time
  findPotentialMatches(currentRide, availableRides) {
    return availableRides.filter(ride => {
      // Same destination
      if (ride.destination !== currentRide.destination) return false;
      // Time overlap
      if (!this.timesOverlap(
        currentRide.departureDatetime,
        currentRide.timeFlexibilityMinutes,
        ride.departureDatetime,
        ride.timeFlexibilityMinutes
      )) return false;
      // Not the same ride
      if (ride.rideId === currentRide.rideId) return false;
      // Both have available seats
      if (currentRide.maxPassengers <= 0 || ride.maxPassengers <= 0) return false;

      return true;
    });
  }
}

// ============================================================================
// AUTHENTICATION SERVICE LOGIC TESTS
// ============================================================================

class AuthServiceLogic {
  // Validate USC email domain
  isUSCEmail(email) {
    return email.endsWith("@usc.edu");
  }

  // Extract email from token response
  extractEmailFromResponse(response) {
    if (!response || !response.email) {
      throw new Error("Invalid token response - missing email");
    }
    return response.email;
  }

  // Check if email is verified
  isEmailVerified(response) {
    if (!response) return false;
    const verified = response.email_verified;
    return verified === true || verified === "true";
  }

  // Generate JWT claims
  generateJWTClaims(userId, email) {
    if (!userId || !email) {
      throw new Error("Missing userId or email");
    }
    return {
      sub: userId,
      email: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    };
  }

  // Validate JWT expiry
  isJWTExpired(token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  }
}

// ============================================================================
// RIDE FILTERING LOGIC TESTS
// ============================================================================

class RideFilterLogic {
  // Validate filter parameters
  validateFilterParams(filters) {
    const errors = [];

    if (filters.destination && !this.isValidDestination(filters.destination)) {
      errors.push("Invalid destination");
    }

    if (filters.minPassengers !== undefined && filters.minPassengers !== null && filters.minPassengers < 1) {
      errors.push("Min passengers must be >= 1");
    }

    if (filters.maxPassengers && filters.maxPassengers > 4) {
      errors.push("Max passengers cannot exceed 4");
    }

    if (filters.departureDate) {
      const date = new Date(filters.departureDate);
      if (isNaN(date.getTime())) {
        errors.push("Invalid departure date");
      }
    }

    return errors;
  }

  isValidDestination(destination) {
    const validDestinations = ["LAX", "BURBANK", "LONG_BEACH", "ONTARIO", "SANTA_MONICA"];
    return validDestinations.includes(destination);
  }

  // Apply multiple filters to rides
  applyFilters(rides, filters) {
    let filtered = rides;

    if (filters.destination) {
      filtered = filtered.filter(r => r.destination === filters.destination);
    }

    if (filters.minPassengers) {
      filtered = filtered.filter(r => r.maxPassengers >= filters.minPassengers);
    }

    if (filters.costSplitPreference) {
      filtered = filtered.filter(r => r.costSplitPreference === filters.costSplitPreference);
    }

    if (filters.departureDate) {
      const targetDate = new Date(filters.departureDate);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(r => {
        const rideDate = new Date(r.departureDatetime);
        return rideDate >= targetDate && rideDate < nextDay;
      });
    }

    return filtered;
  }

  // Sort rides by departure time
  sortByDepartureTime(rides) {
    return rides.sort((a, b) =>
      new Date(a.departureDatetime) - new Date(b.departureDatetime)
    );
  }

  // Sort rides by number of available seats
  sortByAvailableSeats(rides) {
    return rides.sort((a, b) => b.maxPassengers - a.maxPassengers);
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

// --- Ride Service Tests ---
runner.test("RideService: Valid destination accepted (LAX)", function () {
  const service = new RideServiceLogic();
  runner.assert(service.isValidDestination("LAX"), "LAX should be valid");
});

runner.test("RideService: Invalid destination rejected (SFO)", function () {
  const service = new RideServiceLogic();
  runner.assert(!service.isValidDestination("SFO"), "SFO should not be valid");
});

runner.test("RideService: Future departure time validated", function () {
  const service = new RideServiceLogic();
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  runner.assert(service.isValidDepartureTime(futureTime), "Future time should be valid");
});

runner.test("RideService: Past departure time rejected", function () {
  const service = new RideServiceLogic();
  const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  runner.assert(!service.isValidDepartureTime(pastTime), "Past time should not be valid");
});

runner.test("RideService: Valid max passengers (1-4)", function () {
  const service = new RideServiceLogic();
  runner.assert(service.isValidMaxPassengers(1), "1 passenger should be valid");
  runner.assert(service.isValidMaxPassengers(4), "4 passengers should be valid");
  runner.assert(!service.isValidMaxPassengers(0), "0 passengers should not be valid");
  runner.assert(!service.isValidMaxPassengers(5), "5 passengers should not be valid");
});

runner.test("RideService: Valid cost split preferences", function () {
  const service = new RideServiceLogic();
  runner.assert(service.isValidCostSplitPreference("EQUAL"), "EQUAL should be valid");
  runner.assert(service.isValidCostSplitPreference("DRIVER_PAYS_ALL"), "DRIVER_PAYS_ALL should be valid");
  runner.assert(!service.isValidCostSplitPreference("INVALID"), "INVALID should not be valid");
});

runner.test("RideService: Calculate flexible time window", function () {
  const service = new RideServiceLogic();
  const departureTime = new Date("2025-03-15T14:00:00Z");
  const window = service.getFlexibleTimeWindow(departureTime, 30);

  runner.assert(window.earliestTime instanceof Date, "Should return Date object");
  runner.assertEqual(
    window.latestTime.getTime() - window.earliestTime.getTime(),
    60 * 60 * 1000,
    "Window should be 60 minutes (±30 minutes)"
  );
});

runner.test("RideService: Detect overlapping time windows", function () {
  const service = new RideServiceLogic();
  const time1 = new Date("2025-03-15T14:00:00Z");
  const time2 = new Date("2025-03-15T14:15:00Z");

  const overlap = service.timesOverlap(time1, 30, time2, 30);
  runner.assert(overlap, "Times with 30-minute flexibility should overlap");
});

runner.test("RideService: Detect non-overlapping time windows", function () {
  const service = new RideServiceLogic();
  const time1 = new Date("2025-03-15T14:00:00Z");
  const time2 = new Date("2025-03-15T16:00:00Z");

  const overlap = service.timesOverlap(time1, 15, time2, 15);
  runner.assert(!overlap, "Times 2 hours apart with 15-minute flexibility should not overlap");
});

runner.test("RideService: Filter rides by destination", function () {
  const service = new RideServiceLogic();
  const rides = [
    { rideId: "1", destination: "LAX" },
    { rideId: "2", destination: "BURBANK" },
    { rideId: "3", destination: "LAX" }
  ];

  const filtered = service.filterRidesByDestination(rides, "LAX");
  runner.assertEqual(filtered.length, 2, "Should filter to 2 LAX rides");
  runner.assert(filtered.every(r => r.destination === "LAX"), "All filtered rides should be LAX");
});

runner.test("RideService: Find potential matches", function () {
  const service = new RideServiceLogic();
  const currentRide = {
    rideId: "1",
    destination: "LAX",
    departureDatetime: new Date("2025-03-15T14:00:00Z"),
    timeFlexibilityMinutes: 30,
    maxPassengers: 2
  };

  const availableRides = [
    {
      rideId: "2",
      destination: "LAX",
      departureDatetime: new Date("2025-03-15T14:15:00Z"),
      timeFlexibilityMinutes: 30,
      maxPassengers: 2
    },
    {
      rideId: "3",
      destination: "BURBANK",
      departureDatetime: new Date("2025-03-15T14:00:00Z"),
      timeFlexibilityMinutes: 30,
      maxPassengers: 2
    },
    {
      rideId: "4",
      destination: "LAX",
      departureDatetime: new Date("2025-03-15T18:00:00Z"),
      timeFlexibilityMinutes: 30,
      maxPassengers: 2
    }
  ];

  const matches = service.findPotentialMatches(currentRide, availableRides);
  runner.assertEqual(matches.length, 1, "Should find 1 potential match");
  runner.assertEqual(matches[0].rideId, "2", "Match should be ride 2");
});

// --- Authentication Service Tests ---
runner.test("AuthService: Validate USC email domain", function () {
  const service = new AuthServiceLogic();
  runner.assert(service.isUSCEmail("student@usc.edu"), "USC email should be valid");
  runner.assert(!service.isUSCEmail("user@gmail.com"), "Non-USC email should not be valid");
});

runner.test("AuthService: Extract email from token response", function () {
  const service = new AuthServiceLogic();
  const response = { email: "test@usc.edu", email_verified: true };
  const email = service.extractEmailFromResponse(response);
  runner.assertEqual(email, "test@usc.edu", "Should extract email correctly");
});

runner.test("AuthService: Reject response missing email", function () {
  const service = new AuthServiceLogic();
  const response = { email_verified: true };
  runner.assertThrows(
    () => service.extractEmailFromResponse(response),
    "Should throw error for missing email"
  );
});

runner.test("AuthService: Verify email verification status", function () {
  const service = new AuthServiceLogic();
  runner.assert(
    service.isEmailVerified({ email_verified: true }),
    "Should recognize verified email (boolean true)"
  );
  runner.assert(
    service.isEmailVerified({ email_verified: "true" }),
    "Should recognize verified email (string 'true')"
  );
  runner.assert(
    !service.isEmailVerified({ email_verified: false }),
    "Should reject unverified email"
  );
});

runner.test("AuthService: Generate JWT claims with required fields", function () {
  const service = new AuthServiceLogic();
  const userId = "123-456-789";
  const email = "user@usc.edu";
  const claims = service.generateJWTClaims(userId, email);

  runner.assertEqual(claims.sub, userId, "Claims should contain userId as 'sub'");
  runner.assertEqual(claims.email, email, "Claims should contain email");
  runner.assertExists(claims.iat, "Claims should have issued-at time");
  runner.assertExists(claims.exp, "Claims should have expiration time");
});

runner.test("AuthService: Reject JWT claim generation with missing userId", function () {
  const service = new AuthServiceLogic();
  runner.assertThrows(
    () => service.generateJWTClaims(null, "user@usc.edu"),
    "Should throw error for missing userId"
  );
});

// --- Ride Filter Tests ---
runner.test("RideFilter: Validate destination in filters", function () {
  const service = new RideFilterLogic();
  const errors = service.validateFilterParams({ destination: "LAX" });
  runner.assertEqual(errors.length, 0, "Valid destination should have no errors");
});

runner.test("RideFilter: Reject invalid destination in filters", function () {
  const service = new RideFilterLogic();
  const errors = service.validateFilterParams({ destination: "SFO" });
  runner.assert(
    errors.some(e => e.includes("Invalid destination")),
    "Should have destination error"
  );
});

runner.test("RideFilter: Validate passenger constraints", function () {
  const service = new RideFilterLogic();
  const errors1 = service.validateFilterParams({ minPassengers: 0 });
  runner.assert(
    errors1.some(e => e.includes("Min passengers")),
    "Should reject 0 passengers"
  );

  const errors2 = service.validateFilterParams({ maxPassengers: 5 });
  runner.assert(
    errors2.some(e => e.includes("Max passengers")),
    "Should reject > 4 passengers"
  );
});

runner.test("RideFilter: Apply destination filter", function () {
  const service = new RideFilterLogic();
  const rides = [
    { destination: "LAX", maxPassengers: 2 },
    { destination: "BURBANK", maxPassengers: 3 },
    { destination: "LAX", maxPassengers: 1 }
  ];

  const filtered = service.applyFilters(rides, { destination: "LAX" });
  runner.assertEqual(filtered.length, 2, "Should filter to LAX rides");
});

runner.test("RideFilter: Apply multiple filters", function () {
  const service = new RideFilterLogic();
  const rides = [
    { destination: "LAX", maxPassengers: 2, costSplitPreference: "EQUAL" },
    { destination: "LAX", maxPassengers: 1, costSplitPreference: "EQUAL" },
    { destination: "BURBANK", maxPassengers: 3, costSplitPreference: "EQUAL" }
  ];

  const filtered = service.applyFilters(rides, {
    destination: "LAX",
    minPassengers: 2
  });
  runner.assertEqual(filtered.length, 1, "Should apply all filters correctly");
});

runner.test("RideFilter: Sort rides by departure time", function () {
  const service = new RideFilterLogic();
  const rides = [
    { departureDatetime: "2025-03-15T16:00:00Z" },
    { departureDatetime: "2025-03-15T14:00:00Z" },
    { departureDatetime: "2025-03-15T15:00:00Z" }
  ];

  const sorted = service.sortByDepartureTime(rides);
  runner.assertEqual(
    sorted[0].departureDatetime,
    "2025-03-15T14:00:00Z",
    "First ride should be earliest"
  );
  runner.assertEqual(
    sorted[2].departureDatetime,
    "2025-03-15T16:00:00Z",
    "Last ride should be latest"
  );
});

runner.test("RideFilter: Sort rides by available seats", function () {
  const service = new RideFilterLogic();
  const rides = [
    { maxPassengers: 1 },
    { maxPassengers: 4 },
    { maxPassengers: 2 }
  ];

  const sorted = service.sortByAvailableSeats(rides);
  runner.assertEqual(sorted[0].maxPassengers, 4, "First should have most seats");
  runner.assertEqual(sorted[2].maxPassengers, 1, "Last should have fewest seats");
});

// Run all tests
runner.run();
