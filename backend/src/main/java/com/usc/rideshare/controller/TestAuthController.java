package com.usc.rideshare.controller;

import com.usc.rideshare.dto.AuthResponse;
import com.usc.rideshare.entity.User;
import com.usc.rideshare.repository.UserRepository;
import com.usc.rideshare.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * TEST ONLY - Remove in production!
 * Allows quick user switching for testing chat/matches
 */
@RestController
@RequestMapping("/api/test")
public class TestAuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public TestAuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Login as any user by email (TEST ONLY!)
     * POST /api/test/login
     * Body: { "email": "user@usc.edu" }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> testLogin(@RequestBody TestLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        String token = jwtUtil.generateToken(user.getUserId());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getUserId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());

        return ResponseEntity.ok(response);
    }

    /**
     * Get all users for easy testing
     * GET /api/test/users
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    static class TestLoginRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}
