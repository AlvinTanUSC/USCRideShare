# Testing Guide - USC RideShare

Complete guide to running all tests across the USC RideShare project.

---

## 📊 Test Overview

| Layer | Type | File | Count | Dependencies | Time |
|-------|------|------|-------|--------------|------|
| Unit | White Box | white-box-tests.js | 30 | None | ~2s |
| Unit | Backend | backend-unit-tests.js | 23 | Node.js | ~1s |
| Integration | Frontend | frontend-tests.js | 3 | Node.js | ~1s |
| Integration | Black Box | black-box-tests.js | 12 | Running Backend | ~5s |
| **TOTAL** | | | **68** | | **~15min** |

---

## 🚀 Quick Start

### Run All Tests in 3 Steps

**Step 1: Install Dependencies**
```bash
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/testing
npm install
npm init -y
npm install axios
```

**Step 2: Run Unit & Integration Tests**
```bash
# White Box Tests (business logic)
node white-box-tests.js

# Backend Unit Tests (service layer with mocks)
node backend-unit-tests.js

# Frontend Tests (React component logic)
node frontend-tests.js
```

**Step 3: Run Full API Tests (Backend must be running)**
```bash
# Terminal 1: Start Backend
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/backend
mvn spring-boot:run

# Terminal 2: Run Black Box Tests
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/testing
node black-box-tests.js
```

**Total Time:** ~15 minutes for complete test suite

---

## 📋 Test Files Description

### 1. White Box Tests (`white-box-tests.js`)
**Purpose:** Unit testing of isolated business logic components

**Coverage:** 30 tests
- **Ride Service Logic** (15 tests)
  - Destination validation (LAX, BURBANK, DOWNTOWN_LA, USC)
  - Departure time validation (must be future)
  - Max passengers validation (1-4 range)
  - Flexible time window calculations
  - Time overlap detection
  - Ride filtering by destination

- **Auth Service Logic** (7 tests)
  - USC email domain validation (@usc.edu)
  - Email extraction from tokens
  - Email verification checking
  - JWT claim generation
  - Token expiry validation
  - Error handling

- **Ride Filter Logic** (8 tests)
  - Filter parameter validation
  - Destination filtering
  - Passenger constraints filtering
  - Cost split preference filtering
  - Date range filtering
  - Sorting by departure time
  - Sorting by available seats

**Key Features:**
- ✅ Runs without backend
- ✅ Fast execution (~2 seconds)
- ✅ No external dependencies
- ✅ Pure business logic testing

**Run:**
```bash
node white-box-tests.js
```

**Expected Output:**
```
🔬 WHITE BOX TESTING - USC RideShare

==================================================
✅ Ride Service: Valid destination accepted (LAX)
✅ Ride Service: Invalid destination rejected (SFO)
...
📊 Results: 30 passed, 0 failed
✅ ALL TESTS PASSED!
```

---

### 2. Backend Unit Tests (`backend-unit-tests.js`)
**Purpose:** Service layer testing with mocked repositories

**Coverage:** 23 tests across 4 services
- **RideService** (8 tests)
  - Create ride (valid/invalid destinations)
  - Validate past departure times
  - Validate passenger count constraints
  - Get ride by ID
  - Cancel ride
  - Filter rides by destination

- **AuthService** (6 tests)
  - Verify USC email tokens
  - Reject non-USC emails
  - Create new users
  - Return existing users
  - Generate JWT claims
  - Handle invalid tokens

- **MatchingService** (5 tests)
  - Find potential matches
  - Reject different destinations
  - Reject non-overlapping times
  - Create matches
  - Complete matches

- **ChatService** (4 tests)
  - Send messages
  - Reject messages for non-existent matches
  - Retrieve chat history
  - Handle long messages

**Key Features:**
- ✅ Mocked repositories (no database needed)
- ✅ Fast execution (~1 second)
- ✅ Service layer focused
- ✅ Mock object assertions

**Run:**
```bash
node backend-unit-tests.js
```

**Expected Output:**
```
🧪 BACKEND UNIT TESTING - RideService

==================================================
✅ Create ride with valid request succeeds
✅ Create ride rejects invalid destination
...
📊 Results: 23 passed, 0 failed
✅ ALL TESTS PASSED!
```

---

### 3. Frontend Tests (`frontend-tests.js`)
**Purpose:** React component logic testing (reference model)

**Coverage:** 3 tests
- Ride information display
- Match button navigation
- Status badge color logic

**Run:**
```bash
node frontend-tests.js
```

---

### 4. Black Box Tests (`black-box-tests.js`)
**Purpose:** Full API integration testing

**Coverage:** 12 tests
- Health check endpoint
- Ride creation (valid/invalid requests)
- Ride retrieval and filtering
- Match operations
- Chat functionality
- Error handling

**Requires:** Backend running on `http://localhost:8080`

**Run:**
```bash
# Terminal 1: Start Backend
cd backend && mvn spring-boot:run

# Terminal 2: Run Tests
cd testing && node black-box-tests.js
```

---

## 📖 Test Scenarios Covered

### Ride Management
```
✅ Create ride with valid destination and future time
✅ Create ride with invalid destination (rejected)
✅ Create ride with past departure time (rejected)
✅ Create ride with invalid passenger count (rejected)
✅ Get ride by ID
✅ Get non-existent ride (error)
✅ Cancel ride and update status
✅ Filter rides by destination
```

### Authentication
```
✅ Verify USC email token (@usc.edu)
✅ Reject non-USC email token (@gmail.com)
✅ Create new user on first token verification
✅ Return existing user on repeat login
✅ Generate JWT claims with required fields
✅ Reject invalid tokens
```

### Matching
```
✅ Find potential matches (same destination + overlapping time)
✅ Reject matches with different destinations
✅ Reject matches with non-overlapping times
✅ Create match with PENDING status
✅ Complete match and update to ACCEPTED
```

### Chat/Messaging
```
✅ Send message to existing match
✅ Reject message to non-existent match
✅ Retrieve chat history in order
✅ Handle long messages (500+ characters)
```

---

## 🔧 Running Specific Tests

### Run Single Test File
```bash
# White box tests only
node white-box-tests.js

# Backend unit tests only
node backend-unit-tests.js

# Frontend tests only
node frontend-tests.js

# Black box tests (requires backend)
node black-box-tests.js
```

### Run All Tests in Sequence
```bash
npm install && \
node white-box-tests.js && \
node backend-unit-tests.js && \
node frontend-tests.js
```

### Run Tests with Backend (Full Suite)
```bash
# Terminal 1
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/backend
mvn spring-boot:run

# Terminal 2
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/testing
npm install && \
node white-box-tests.js && \
node backend-unit-tests.js && \
node frontend-tests.js && \
node black-box-tests.js
```

---

## 📊 Test File Organization

```
/testing/
├── white-box-tests.js           ✅ Business logic unit tests (30 tests)
├── backend-unit-tests.js        ✅ Service layer with mocks (23 tests)
├── frontend-tests.js            📋 Component logic tests (3 tests)
├── black-box-tests.js           📋 API integration tests (12 tests)
└── package.json                 npm dependencies
```

---

## 🛠️ Troubleshooting

### "Cannot find module" error
```bash
# Solution: Install dependencies
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/testing
npm install
```

### Black box tests fail with connection error
```bash
# Solution: Ensure backend is running
cd /Users/afrinmomin/Documents/GitHub/USCRideShare/backend
mvn spring-boot:run

# Verify backend health
curl http://localhost:8080/api/v1/health
```

### Tests hang or timeout
```bash
# Solution: Check for running processes
lsof -i :8080              # Check port 8080 for backend
ps aux | grep node         # Check for hanging node processes

# Kill if necessary
kill -9 <PID>
```

### Some tests fail intermittently
```bash
# This is normal for integration tests. Retry:
node black-box-tests.js
```

---

## 🎯 Test Design Patterns

### White Box Tests
- **Isolation:** Pure JavaScript logic with no external dependencies
- **Mocking:** None needed (testing logic directly)
- **Assertions:** Direct boolean and equality checks
- **Setup:** Create instances, pass test data

```javascript
// Example: Testing ride validation
const rideService = new RideServiceLogic();
runner.assert(
  rideService.isValidDestination("LAX"),
  "LAX should be valid destination"
);
```

### Backend Unit Tests
- **Isolation:** Services with mocked repositories
- **Mocking:** MockRideRepository, MockUserRepository, etc.
- **Assertions:** NotNull, Throws, ArrayContains
- **Setup:** Arrange test data, Act, Assert

```javascript
// Example: Testing ride creation
const request = { destination: 'LAX', departureDatetime: futureTime };
const ride = rideService.createRide(request, userId);
this.assertNotNull(ride.id, 'Ride ID should be assigned');
```

### Frontend Tests
- **Isolation:** Component logic without rendering
- **Mocking:** Mock objects for props and functions
- **Assertions:** Value comparisons and method calls
- **Setup:** Initialize component, call methods

### Black Box Tests
- **Integration:** Full API workflow testing
- **Mocking:** None (tests real backend)
- **Assertions:** HTTP status codes and response validation
- **Setup:** Send HTTP requests via axios

---

## 📈 Test Coverage Summary

**Total Test Cases:** 68

**Coverage by Component:**
- Ride Management: 20 tests
- Authentication: 13 tests
- Matching Algorithm: 14 tests
- Chat/Messaging: 10 tests
- API Endpoints: 11 tests

**Coverage by Type:**
- Happy Path (Success): 40 tests
- Error Cases: 20 tests
- Edge Cases: 8 tests

---

## 🚦 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd testing && npm install
      
      - name: Run white box tests
        run: cd testing && node white-box-tests.js
      
      - name: Run backend unit tests
        run: cd testing && node backend-unit-tests.js
      
      - name: Run frontend tests
        run: cd testing && node frontend-tests.js
```

---

## 📝 Key Testing Principles

1. **Test Pyramid** - More unit tests, fewer integration tests
2. **Isolation** - Tests run independently
3. **Repeatability** - Tests pass consistently
4. **Clarity** - Test names describe scenarios
5. **Speed** - Fast execution for quick feedback
6. **Coverage** - Happy path, errors, edge cases
7. **Maintainability** - Easy to update

---

## ✅ Validation Checklist

Before deployment, verify:
- [ ] All white box tests pass (30/30)
- [ ] All backend unit tests pass (23/23)
- [ ] All frontend tests pass (3/3)
- [ ] All black box tests pass (12/12)
- [ ] Total: 68/68 passing
- [ ] No flaky tests (run twice to confirm)

---

**Last Updated:** December 12, 2025
**Test Framework:** Custom JavaScript TestRunner
**Total Tests:** 68 | Status: ✅ Ready to Use
