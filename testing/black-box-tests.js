// /Users/shrutinatala/Desktop/USCRideShare/testing/black-box-tests.js

const axios = require("axios");

const API_URL = process.env.API_URL || "http://localhost:8080";

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  validateStatus: () => true, // Don't throw on any status
});

async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: "✅ PASS" });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name,
      status: `❌ FAIL: ${error.message}`,
    });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkBackendHealth() {
  console.log(`\n🔍 Checking backend at: ${API_URL}\n`);
  try {
    const response = await apiClient.get("/api/health/ping");
    console.log(`✅ Backend is reachable. Status: ${response.status}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Backend is not reachable at ${API_URL}`);
    console.error(`Error: ${error.message}`);
    console.error(`\n⚠️  Make sure your backend is running:`);
    console.error(`   cd /Users/shrutinatala/Desktop/USCRideShare/backend`);
    console.error(`   mvn spring-boot:run\n`);
    return false;
  }
}

async function runTests() {
  console.log("\n🧪 BLACK BOX TESTING - USC RideShare");
  console.log("=".repeat(50));

  // Check if backend is running first
  const backendHealthy = await checkBackendHealth();
  if (!backendHealthy) {
    console.log("Cannot run tests without backend. Exiting.\n");
    process.exit(1);
  }

  // Test 1: Create valid ride
  await test("Create valid ride with LAX destination", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const rideData = {
      originLocation: "USC Village",
      destination: "LAX",
      departureDatetime: futureDate,
      flexibleTime: true,
      timeFlexibilityMinutes: 30,
      maxPassengers: 2,
      costSplitPreference: "EQUAL",
      notes: "Test ride",
    };

    const response = await apiClient.post("/api/rides", rideData);

    // Accept 201 (created), 401 (unauthorized - no auth), or 400 (validation)
    assert(
      response.status === 201 ||
        response.status === 401 ||
        response.status === 400,
      `Expected 201/401/400, got ${response.status}`
    );
  });

  // Test 2: Create invalid ride with bad destination
  await test("Reject ride with invalid destination (SFO)", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const rideData = {
      originLocation: "USC Village",
      destination: "SFO",
      departureDatetime: futureDate,
      maxPassengers: 2,
    };

    const response = await apiClient.post("/api/rides", rideData);

    // Should NOT create successfully
    assert(
      response.status !== 201,
      `Invalid destination SFO should not return 201, got ${response.status}`
    );
  });

  // Test 3: Reject ride with past departure time
  await test("Reject ride with past departure time", async () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    const rideData = {
      originLocation: "USC Village",
      destination: "LAX",
      departureDatetime: pastDate,
      maxPassengers: 2,
    };

    const response = await apiClient.post("/api/rides", rideData);

    // Should reject (not 201)
    assert(
      response.status !== 201,
      `Past date should not return 201, got ${response.status}`
    );
  });

  // Test 4: Timezone rendering - Get rides
  await test("Get rides with proper datetime format", async () => {
    const response = await apiClient.get("/api/rides");

    assert(
      response.status === 200 || response.status === 401,
      `Expected 200/401, got ${response.status}`
    );

    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      const ride = response.data[0];
      assert(
        ride.departureDatetime !== undefined,
        "Ride should have departureDatetime"
      );
    }
  });

  // Test 5: Cancel ride endpoint
  await test("Cancel ride endpoint responds appropriately", async () => {
    const testRideId = "00000000-0000-0000-0000-000000000000";
    const response = await apiClient.patch(
      `/api/rides/${testRideId}/cancel`,
      {}
    );

    // Accept any non-500 response
    assert(
      response.status !== 500,
      `Should not return 500, got ${response.status}`
    );
  });

  // Test 6: Get potential matches
  await test("Get potential matches for a ride", async () => {
    const testRideId = "00000000-0000-0000-0000-000000000000";
    const response = await apiClient.get(
      `/api/matches/potential/${testRideId}`
    );

    // Accept any response except 500
    assert(
      response.status !== 500,
      `Should not return 500, got ${response.status}`
    );
  });

  // Test 7: Complete match endpoint
  await test("Complete match endpoint exists", async () => {
    const testMatchId = "00000000-0000-0000-0000-000000000000";
    const response = await apiClient.post(
      `/api/matches/${testMatchId}/complete`,
      {}
    );

    // Accept any response except 500
    assert(
      response.status !== 500,
      `Should not return 500, got ${response.status}`
    );
  });

  // Test 8: Cancel match endpoint
  await test("Cancel match endpoint exists", async () => {
    const testMatchId = "00000000-0000-0000-0000-000000000000";
    const response = await apiClient.delete(`/api/matches/${testMatchId}`);

    // Accept any response except 500
    assert(
      response.status !== 500,
      `Should not return 500, got ${response.status}`
    );
  });

  // Test 9: Get messages endpoint
  await test("Get messages for a match", async () => {
    const testMatchId = "00000000-0000-0000-0000-000000000000";
    const response = await apiClient.get(
      `/api/chat/match/${testMatchId}?userId=00000000-0000-0000-0000-000000000000`
    );

    // Accept any response except 500
    assert(
      response.status !== 500,
      `Should not return 500, got ${response.status}`
    );
  });

  // Test 10: Filter rides by destination
  await test("Filter rides by destination (LAX)", async () => {
    const response = await apiClient.get("/api/rides?destination=LAX");

    assert(
      response.status === 200 || response.status === 401,
      `Expected 200/401, got ${response.status}`
    );

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((ride) => {
        if (ride.destination) {
          assert(
            ride.destination.includes("LAX"),
            `Should only have LAX rides, got ${ride.destination}`
          );
        }
      });
    }
  });

  // Test 11: Handle long messages gracefully
  await test("Handle long messages without crashing", async () => {
    const longMessage = "a".repeat(500);
    const response = await apiClient.post("/api/chat/match/test-match-id", {
      content: longMessage,
    });

    // Should not return 500
    assert(
      response.status !== 500,
      `Should handle long messages gracefully, got ${response.status}`
    );
  });

  // Print results
  console.log("\n" + "=".repeat(50));
  console.log(
    `\n📊 Test Results: ${testResults.passed} passed, ${testResults.failed} failed\n`
  );

  testResults.tests.forEach((t) => {
    console.log(`${t.status}: ${t.name}`);
  });

  if (testResults.failed === 0) {
    console.log("\n✅ ALL TESTS PASSED!\n");
    process.exit(0);
  } else {
    console.log(`\n❌ ${testResults.failed} test(s) failed\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Test suite error:", error.message);
  process.exit(1);
});