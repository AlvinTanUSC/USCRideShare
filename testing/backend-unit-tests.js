/**
 * Backend Unit Tests - USC RideShare
 * 
 * Tests service layer business logic with mocked dependencies.
 * Uses a custom TestRunner class similar to frontend and white-box tests.
 * 
 * Run: node backend-unit-tests.js
 */

class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, testFn) {
    this.tests.push({ description, testFn: testFn.bind(this) });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertNull(value, message) {
    if (value !== null && value !== undefined) {
      throw new Error(message || `Expected null/undefined, got ${value}`);
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || 'Expected value not to be null/undefined');
    }
  }

  assertArrayContains(arr, value, message) {
    if (!arr.includes(value)) {
      throw new Error(message || `Array does not contain ${value}`);
    }
  }

  assertThrows(fn, message) {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      if (e.message === (message || 'Expected function to throw')) {
        throw e;
      }
      // Expected behavior - function threw an error
    }
  }

  run() {
    console.log(`\n🧪 BACKEND UNIT TESTING - ${this.name}\n`);
    console.log('='.repeat(50));

    this.tests.forEach(({ description, testFn }) => {
      try {
        testFn();
        console.log(`✅ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    });

    console.log('='.repeat(50));
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('✅ ALL TESTS PASSED!\n');
    } else {
      console.log(`⚠️  ${this.failed} test(s) failed\n`);
    }
  }
}

// ============================================================================
// MOCK CLASSES - Simulate service dependencies
// ============================================================================

class MockRideRepository {
  constructor() {
    this.rides = new Map();
    this.nextId = 1;
  }

  save(ride) {
    if (!ride.id) {
      ride.id = this.nextId++;
    }
    this.rides.set(ride.id, ride);
    return ride;
  }

  findById(id) {
    return this.rides.get(id) || null;
  }

  findAll() {
    return Array.from(this.rides.values());
  }

  findByDestination(destination) {
    return Array.from(this.rides.values()).filter(r => r.destination === destination);
  }

  delete(id) {
    this.rides.delete(id);
  }
}

class MockUserRepository {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  save(user) {
    if (!user.id) {
      user.id = this.nextId++;
    }
    this.users.set(user.id, user);
    return user;
  }

  findByEmail(email) {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  findById(id) {
    return this.users.get(id) || null;
  }
}

class MockMatchRepository {
  constructor() {
    this.matches = new Map();
    this.nextId = 1;
  }

  save(match) {
    if (!match.id) {
      match.id = this.nextId++;
    }
    this.matches.set(match.id, match);
    return match;
  }

  findById(id) {
    return this.matches.get(id) || null;
  }

  findByRideId(rideId) {
    return Array.from(this.matches.values()).filter(m => m.rideId === rideId);
  }

  delete(id) {
    this.matches.delete(id);
  }
}

class MockMessageRepository {
  constructor() {
    this.messages = new Map();
    this.nextId = 1;
  }

  save(message) {
    if (!message.id) {
      message.id = this.nextId++;
    }
    this.messages.set(message.id, message);
    return message;
  }

  findByMatchId(matchId) {
    return Array.from(this.messages.values())
      .filter(m => m.matchId === matchId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }
}

// ============================================================================
// SERVICE CLASSES - Simulating Spring Boot services with mock repositories
// ============================================================================

class RideService {
  constructor(rideRepository, userRepository) {
    this.rideRepository = rideRepository;
    this.userRepository = userRepository;
  }

  createRide(request, userId) {
    // Validation
    if (!request.destination || !['LAX', 'BURBANK', 'DOWNTOWN_LA', 'USC'].includes(request.destination)) {
      throw new Error('Invalid destination');
    }

    const now = new Date();
    if (new Date(request.departureDatetime) <= now) {
      throw new Error('Departure time must be in the future');
    }

    if (request.maxPassengers < 1 || request.maxPassengers > 4) {
      throw new Error('Max passengers must be between 1 and 4');
    }

    const ride = {
      id: null,
      userId: userId,
      destination: request.destination,
      departureDatetime: request.departureDatetime,
      maxPassengers: request.maxPassengers,
      costSplitPreference: request.costSplitPreference || 'EQUAL',
      status: 'ACTIVE',
      createdAt: new Date()
    };

    return this.rideRepository.save(ride);
  }

  getRideById(rideId) {
    const ride = this.rideRepository.findById(rideId);
    if (!ride) {
      throw new Error(`Ride ${rideId} not found`);
    }
    return ride;
  }

  cancelRide(rideId) {
    const ride = this.getRideById(rideId);
    ride.status = 'CANCELLED';
    return this.rideRepository.save(ride);
  }

  filterRidesByDestination(destination) {
    return this.rideRepository.findByDestination(destination);
  }

  getAllRides() {
    return this.rideRepository.findAll();
  }
}

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  verifyUSCEmailToken(idToken) {
    // Simulate token verification
    if (!idToken || idToken === 'invalid-token') {
      throw new Error('Invalid token');
    }

    const emailMatch = idToken.match(/email:(.+)/);
    if (!emailMatch) {
      throw new Error('Token missing email');
    }

    const email = emailMatch[1];

    // Verify USC email domain
    if (!email.endsWith('@usc.edu')) {
      throw new Error('Email must be @usc.edu domain');
    }

    // Check if user exists, create if not
    let user = this.userRepository.findByEmail(email);
    if (!user) {
      user = {
        id: null,
        email: email,
        verified: true,
        createdAt: new Date()
      };
      user = this.userRepository.save(user);
    }

    return user;
  }

  generateJWTClaims(userId, email) {
    if (!userId || !email) {
      throw new Error('Missing userId or email for JWT generation');
    }

    const now = Math.floor(Date.now() / 1000);
    return {
      userId: userId,
      email: email,
      iat: now,
      exp: now + (24 * 60 * 60) // 24 hours
    };
  }
}

class MatchingService {
  constructor(matchRepository, rideRepository) {
    this.matchRepository = matchRepository;
    this.rideRepository = rideRepository;
  }

  findPotentialMatches(rideId) {
    const targetRide = this.rideRepository.findById(rideId);
    if (!targetRide) {
      throw new Error(`Ride ${rideId} not found`);
    }

    const allRides = this.rideRepository.findAll();
    const targetTime = new Date(targetRide.departureDatetime);
    const flexibilityWindow = 15 * 60 * 1000; // 15 minutes

    return allRides.filter(ride => {
      // Same destination
      if (ride.destination !== targetRide.destination) {
        return false;
      }

      // Different ride
      if (ride.id === rideId) {
        return false;
      }

      // Overlapping times (within flexibility window)
      const rideTime = new Date(ride.departureDatetime);
      const timeDiff = Math.abs(targetTime - rideTime);
      return timeDiff <= flexibilityWindow;
    });
  }

  createMatch(rideId1, rideId2) {
    const ride1 = this.rideRepository.findById(rideId1);
    const ride2 = this.rideRepository.findById(rideId2);

    if (!ride1 || !ride2) {
      throw new Error('One or both rides not found');
    }

    const match = {
      id: null,
      rideId: rideId1,
      matchedRideId: rideId2,
      status: 'PENDING',
      createdAt: new Date()
    };

    return this.matchRepository.save(match);
  }

  completeMatch(matchId) {
    const match = this.matchRepository.findById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    match.status = 'ACCEPTED';
    match.completedAt = new Date();
    return this.matchRepository.save(match);
  }
}

class ChatService {
  constructor(messageRepository, matchRepository) {
    this.messageRepository = messageRepository;
    this.matchRepository = matchRepository;
  }

  sendMessage(matchId, senderId, messageText) {
    const match = this.matchRepository.findById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    if (!messageText || messageText.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    const message = {
      id: null,
      matchId: matchId,
      senderId: senderId,
      text: messageText,
      createdAt: new Date()
    };

    return this.messageRepository.save(message);
  }

  getChatHistory(matchId) {
    const match = this.matchRepository.findById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    return this.messageRepository.findByMatchId(matchId);
  }

  getMessageCount(matchId) {
    return this.messageRepository.findByMatchId(matchId).length;
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

// RIDE SERVICE TESTS
const rideServiceTests = new TestRunner('RideService');
const rideRepo = new MockRideRepository();
const userRepo = new MockUserRepository();
const rideService = new RideService(rideRepo, userRepo);

rideServiceTests.test('Create ride with valid request succeeds', function() {
  const request = {
    destination: 'LAX',
    departureDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPassengers: 3,
    costSplitPreference: 'EQUAL'
  };

  const ride = rideService.createRide(request, 1);
  this.assertNotNull(ride.id, 'Ride ID should be assigned');
  this.assertEqual(ride.destination, 'LAX', 'Destination should be LAX');
  this.assertEqual(ride.status, 'ACTIVE', 'Status should be ACTIVE');
});

rideServiceTests.test('Create ride rejects invalid destination', function() {
  const request = {
    destination: 'SFO',
    departureDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPassengers: 2
  };

  this.assertThrows(() => {
    rideService.createRide(request, 1);
  }, 'Should reject invalid destination SFO');
});

rideServiceTests.test('Create ride rejects past departure time', function() {
  const request = {
    destination: 'LAX',
    departureDatetime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    maxPassengers: 2
  };

  this.assertThrows(() => {
    rideService.createRide(request, 1);
  }, 'Should reject past departure time');
});

rideServiceTests.test('Create ride rejects invalid passenger count', function() {
  const request = {
    destination: 'LAX',
    departureDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPassengers: 5
  };

  this.assertThrows(() => {
    rideService.createRide(request, 1);
  }, 'Should reject passenger count > 4');
});

rideServiceTests.test('Get ride by ID returns ride successfully', function() {
  const request = {
    destination: 'BURBANK',
    departureDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPassengers: 2
  };

  const created = rideService.createRide(request, 1);
  const retrieved = rideService.getRideById(created.id);
  this.assertEqual(retrieved.id, created.id, 'Should retrieve correct ride');
});

rideServiceTests.test('Get ride throws for non-existent ride ID', function() {
  this.assertThrows(() => {
    rideService.getRideById(99999);
  }, 'Should throw for non-existent ride');
});

rideServiceTests.test('Cancel ride updates status to CANCELLED', function() {
  const request = {
    destination: 'DOWNTOWN_LA',
    departureDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPassengers: 2
  };

  const ride = rideService.createRide(request, 1);
  const cancelled = rideService.cancelRide(ride.id);
  this.assertEqual(cancelled.status, 'CANCELLED', 'Status should be CANCELLED');
});

rideServiceTests.test('Filter rides by destination returns matching rides', function() {
  const request1 = {
    destination: 'LAX',
    departureDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    maxPassengers: 2
  };

  rideService.createRide(request1, 1);
  const laxRides = rideService.filterRidesByDestination('LAX');
  this.assert(laxRides.length > 0, 'Should find LAX rides');
});

// AUTH SERVICE TESTS
const authServiceTests = new TestRunner('AuthService');
const authUserRepo = new MockUserRepository();
const authService = new AuthService(authUserRepo);

authServiceTests.test('Verify valid USC email token succeeds', function() {
  const token = 'email:test@usc.edu';
  const user = authService.verifyUSCEmailToken(token);
  this.assertNotNull(user.id, 'User should be created with ID');
  this.assertEqual(user.email, 'test@usc.edu', 'Email should be preserved');
  this.assertEqual(user.verified, true, 'User should be verified');
});

authServiceTests.test('Verify non-USC email token fails', function() {
  const token = 'email:test@gmail.com';
  this.assertThrows(() => {
    authService.verifyUSCEmailToken(token);
  }, 'Should reject non-USC email');
});

authServiceTests.test('Verify token returns existing user on repeat login', function() {
  const token = 'email:student@usc.edu';
  const user1 = authService.verifyUSCEmailToken(token);
  const user2 = authService.verifyUSCEmailToken(token);
  this.assertEqual(user1.id, user2.id, 'Should return same user ID');
});

authServiceTests.test('Verify invalid token throws error', function() {
  this.assertThrows(() => {
    authService.verifyUSCEmailToken('invalid-token');
  }, 'Should reject invalid token');
});

authServiceTests.test('Generate JWT claims includes required fields', function() {
  const claims = authService.generateJWTClaims(1, 'user@usc.edu');
  this.assertNotNull(claims.userId, 'JWT should include userId');
  this.assertNotNull(claims.email, 'JWT should include email');
  this.assertNotNull(claims.iat, 'JWT should include issued-at');
  this.assertNotNull(claims.exp, 'JWT should include expiration');
});

authServiceTests.test('Generate JWT fails with missing userId', function() {
  this.assertThrows(() => {
    authService.generateJWTClaims(null, 'user@usc.edu');
  }, 'Should fail with missing userId');
});

// MATCHING SERVICE TESTS
const matchingServiceTests = new TestRunner('MatchingService');
const matchingRideRepo = new MockRideRepository();
const matchingMatchRepo = new MockMatchRepository();
const matchingService = new MatchingService(matchingMatchRepo, matchingRideRepo);

// Reset ride repo ID counter for fresh state
matchingRideRepo.nextId = 1;
matchingRideRepo.rides.clear();

matchingServiceTests.test('Find potential matches with same destination and overlapping time', function() {
  const now = Date.now();
  const futureTime = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const nearFutureTime = new Date(now + 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(); // 5 min later

  const ride1 = matchingRideRepo.save({
    destination: 'LAX',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const ride2 = matchingRideRepo.save({
    destination: 'LAX',
    departureDatetime: nearFutureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const matches = matchingService.findPotentialMatches(ride1.id);
  this.assert(matches.length > 0, 'Should find matching rides');
  this.assertArrayContains(matches.map(r => r.id), ride2.id, 'Should include ride2');
});

matchingServiceTests.test('Find potential matches rejects different destinations', function() {
  // Create fresh repos for this test to avoid pollution from previous tests
  const testRideRepo = new MockRideRepository();
  const testMatchService = new MatchingService(new MockMatchRepository(), testRideRepo);
  
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const ride1 = testRideRepo.save({
    destination: 'LAX',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  testRideRepo.save({
    destination: 'BURBANK',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const matches = testMatchService.findPotentialMatches(ride1.id);
  this.assert(matches.length === 0, 'Should not match different destinations');
});

matchingServiceTests.test('Create match between two rides succeeds', function() {
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const ride1 = matchingRideRepo.save({
    destination: 'USC',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const ride2 = matchingRideRepo.save({
    destination: 'USC',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const match = matchingService.createMatch(ride1.id, ride2.id);
  this.assertNotNull(match.id, 'Match ID should be assigned');
  this.assertEqual(match.status, 'PENDING', 'Match should start in PENDING status');
});

matchingServiceTests.test('Complete match updates status to ACCEPTED', function() {
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const ride1 = matchingRideRepo.save({
    destination: 'LAX',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const ride2 = matchingRideRepo.save({
    destination: 'LAX',
    departureDatetime: futureTime,
    maxPassengers: 2,
    status: 'ACTIVE'
  });

  const match = matchingService.createMatch(ride1.id, ride2.id);
  const completed = matchingService.completeMatch(match.id);
  this.assertEqual(completed.status, 'ACCEPTED', 'Status should be ACCEPTED');
  this.assertNotNull(completed.completedAt, 'Should have completion timestamp');
});

// CHAT SERVICE TESTS
const chatServiceTests = new TestRunner('ChatService');
const chatMessageRepo = new MockMessageRepository();
const chatMatchRepo = new MockMatchRepository();
const chatService = new ChatService(chatMessageRepo, chatMatchRepo);

chatServiceTests.test('Send message to existing match succeeds', function() {
  const match = chatMatchRepo.save({
    status: 'ACCEPTED'
  });

  const message = chatService.sendMessage(match.id, 1, 'Hello, I am the driver');
  this.assertNotNull(message.id, 'Message should have ID');
  this.assertEqual(message.text, 'Hello, I am the driver', 'Message text should be preserved');
});

chatServiceTests.test('Send message to non-existent match fails', function() {
  this.assertThrows(() => {
    chatService.sendMessage(99999, 1, 'Hello');
  }, 'Should fail for non-existent match');
});

chatServiceTests.test('Get chat history returns messages in order', function() {
  const match = chatMatchRepo.save({
    status: 'ACCEPTED'
  });

  chatService.sendMessage(match.id, 1, 'First message');
  chatService.sendMessage(match.id, 2, 'Second message');
  chatService.sendMessage(match.id, 1, 'Third message');

  const history = chatService.getChatHistory(match.id);
  this.assertEqual(history.length, 3, 'Should have 3 messages');
  this.assertEqual(history[0].text, 'First message', 'First message should be in order');
  this.assertEqual(history[2].text, 'Third message', 'Third message should be in order');
});

chatServiceTests.test('Get chat history for non-existent match fails', function() {
  this.assertThrows(() => {
    chatService.getChatHistory(99999);
  }, 'Should fail for non-existent match');
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================

rideServiceTests.run();
authServiceTests.run();
matchingServiceTests.run();
chatServiceTests.run();

console.log('✨ Backend unit testing complete!\n');
