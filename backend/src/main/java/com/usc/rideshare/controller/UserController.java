package com.usc.rideshare.controller;

import com.usc.rideshare.entity.User;
import com.usc.rideshare.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * User controller for development/testing.
 * In production, this would be replaced with proper OAuth integration.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * POST /api/users/login
     * Mock login - creates user if doesn't exist, returns user info.
     * Body: { "email": "...", "firstName": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || !request.getEmail().endsWith("@usc.edu")) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid email. Must be @usc.edu");
            return ResponseEntity.badRequest().body(error);
        }

        // Try to find existing user by email
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        
        User user;
        if (existingUser.isPresent()) {
            // User exists, update last login
            user = existingUser.get();
            user.setLastLogin(Instant.now());
            user = userRepository.save(user);
        } else {
            // Create new user
            user = new User();
            user.setEmail(request.getEmail());
            user.setFirstName(request.getFirstName() != null ? request.getFirstName() : extractFirstName(request.getEmail()));
            // Use "Trojan" as default last name if not provided (database has NOT NULL constraint)
            user.setLastName(request.getLastName() != null ? request.getLastName() : "Trojan");
            user.setPhoneNumber(""); // Default empty
            user.setEmailVerified(true); // Mock verified for development
            user.setCreatedAt(Instant.now());
            user.setLastLogin(Instant.now());
            user = userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getUserId().toString());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("message", existingUser.isPresent() ? "Login successful" : "Account created");

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/users/me
     * Get current user info.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        if (userId == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Not authenticated");
            return ResponseEntity.status(401).body(error);
        }

        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not found");
            return ResponseEntity.status(404).body(error);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.get().getUserId().toString());
        response.put("email", user.get().getEmail());
        response.put("firstName", user.get().getFirstName());
        response.put("lastName", user.get().getLastName());

        return ResponseEntity.ok(response);
    }

    private String extractFirstName(String email) {
        String localPart = email.split("@")[0];
        String[] parts = localPart.split("[._]");
        String name = parts[0];
        return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
    }

    // Request DTOs
    public static class LoginRequest {
        private String email;
        private String firstName;
        private String lastName;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
    }
}

