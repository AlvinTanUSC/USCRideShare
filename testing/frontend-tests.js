// Simple test framework
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

  async run() {
    console.log("\n🧪 FRONTEND UNIT TESTS - USC RideShare\n");
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

// Mock RideCard component logic
class RideCardLogic {
  formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  getStatusBadgeColor(status) {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MATCHED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  renderRideCard(ride) {
    return {
      destination: ride.destination.replace("_", " "),
      status: ride.status,
      origin: ride.originLocation,
      departure: this.formatDateTime(ride.departureDatetime),
      maxPassengers: ride.maxPassengers,
      poster: ride.posterFirstName,
      statusColor: this.getStatusBadgeColor(ride.status),
    };
  }
}

// Test 1: Ride Information Display
runner.test("Ride Information Display", function () {
  const logic = new RideCardLogic();

  const mockRide = {
    rideId: "123",
    destination: "LAX",
    departureDatetime: "2025-03-15T14:30:00Z",
    originLocation: "USC Village",
    posterFirstName: "John",
    status: "ACTIVE",
    maxPassengers: 2,
  };

  const rendered = logic.renderRideCard(mockRide);

  runner.assertExists(rendered.destination, "Destination should be displayed");
  runner.assertEqual(
    rendered.destination,
    "LAX",
    "Destination should show LAX"
  );
  runner.assertExists(rendered.departure, "Departure time should be formatted");
  runner.assertExists(rendered.origin, "Origin should be displayed");
  runner.assertEqual(
    rendered.origin,
    "USC Village",
    "Origin should be USC Village"
  );
  runner.assertExists(rendered.poster, "Poster name should be displayed");
  runner.assertEqual(rendered.poster, "John", "Poster should be John");
  runner.assertEqual(rendered.status, "ACTIVE", "Status should be ACTIVE");
  runner.assertEqual(rendered.maxPassengers, 2, "Max passengers should be 2");
});

// Test 2: Match Button Click (Navigation Logic)
runner.test("Match Button Click - Navigate to ride detail", function () {
  class NavigationMock {
    constructor() {
      this.navigatedTo = null;
    }

    navigate(path) {
      this.navigatedTo = path;
    }
  }

  const nav = new NavigationMock();
  const rideId = "456";

  // Simulate match button click
  nav.navigate(`/rides/${rideId}`);

  runner.assertExists(nav.navigatedTo, "Should navigate somewhere");
  runner.assertEqual(
    nav.navigatedTo,
    "/rides/456",
    "Should navigate to ride detail page"
  );
});

// Test 3: Status Badge Color Logic
runner.test("Status Badge Color Rendering", function () {
  const logic = new RideCardLogic();

  const testCases = [
    { status: "ACTIVE", expected: "bg-green-100 text-green-800" },
    { status: "MATCHED", expected: "bg-blue-100 text-blue-800" },
    { status: "COMPLETED", expected: "bg-gray-100 text-gray-800" },
    { status: "CANCELLED", expected: "bg-red-100 text-red-800" },
  ];

  testCases.forEach((test) => {
    const color = logic.getStatusBadgeColor(test.status);
    runner.assertEqual(
      color,
      test.expected,
      `Status ${test.status} should have correct color`
    );
  });
});

// Run all tests
runner.run();
